import uuid
import razorpay

from decimal import Decimal
from io import BytesIO
from xml.sax.saxutils import escape

from django.conf import settings
from django.db import transaction, IntegrityError
from django.db.models import F, Q, Prefetch
from django.http import HttpResponse
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status, serializers

from product.models import Cart, Product, ProductImage
from users.models import Address, ArtisanProfile
from decimal import Decimal, ROUND_HALF_UP
from .models import (
    Order,
    OrderItem,
    Payment,
    ReturnRequest,
    StockAdjustment,
    ArtisanOrderResponse,
    ArtisanRefund,
)
from django.core.paginator import Paginator
from .serializers import (
    CheckoutSerializer,
    OrderSerializer,
    CancelOrderSerializer,
    ReturnRequestSerializer,
    BuyNowCheckoutSerializer,
)

from .razorpay_service import (
    create_razorpay_order,
    verify_razorpay_signature,
    create_razorpay_refund,
)

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


class RazorpayOrderCreationError(Exception):
    pass


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can place orders."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CheckoutSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        checkout_key = data["checkout_key"]

        existing_order = Order.objects.filter(
            checkout_key=checkout_key
        ).first()

        if existing_order:

            if existing_order.user_id != request.user.id:
                return Response(
                    {"error": "Invalid checkout key."},
                    status=status.HTTP_409_CONFLICT
                )

            return Response(
                OrderSerializer(existing_order).data,
                status=status.HTTP_200_OK
            )

        if data["payment_method"] == Payment.Method.RAZORPAY:

            if (
                not settings.RAZORPAY_KEY_ID
                or not settings.RAZORPAY_KEY_SECRET
            ):
                return Response(
                    {
                        "error": (
                            "Razorpay API keys are not configured. "
                            "Please try again later."
                        )
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

        razorpay_checkout_data = None

        try:
            with transaction.atomic():

                cart = Cart.objects.select_for_update().get(
                    user=request.user
                )

                cart_items = list(
                    cart.items.select_for_update()
                    .select_related(
                        "product__category",
                        "product__artisan__user"
                    )
                    .order_by("id")
                )

                if not cart_items:
                    raise serializers.ValidationError({
                        "cart": "Your cart is empty."
                    })

                product_ids = [
                    item.product_id for item in cart_items
                ]

                products = Product.objects.select_for_update().filter(
                    id__in=product_ids
                ).select_related(
                    "category",
                    "artisan__user"
                ).order_by("id")

                product_map = {
                    product.id: product for product in products
                }

                subtotal = Decimal("0.00")
                order_items_data = []

                for item in cart_items:

                    product = product_map.get(item.product_id)

                    if product is None:
                        raise serializers.ValidationError({
                            "cart": "A product is no longer available."
                        })

                    is_available = (
                        product.is_published
                        and not product.is_deleted
                        and not product.category.is_deleted
                        and product.artisan.verification_status == "APPROVED"
                        and product.artisan.user.is_active
                        and product.stock > 0
                        and item.quantity > 0
                        and item.quantity <= product.stock
                    )

                    if not is_available:
                        raise serializers.ValidationError({
                            "cart": (
                                f"{product.name} is unavailable "
                                "or has insufficient stock."
                            )
                        })

                    if (
                        data["payment_method"] == Payment.Method.COD
                        and not product.allow_cod
                    ):
                        raise serializers.ValidationError({
                            "payment_method": (
                                f"Cash on Delivery is not available "
                                f"for {product.name}. "
                                "Please choose online payment."
                            )
                        })

                    if (
                        data["payment_method"] == Payment.Method.RAZORPAY
                        and not product.allow_online_payment
                    ):
                        raise serializers.ValidationError({
                            "payment_method": (
                                f"Online payment is not available "
                                f"for {product.name}. "
                                "Please choose Cash on Delivery."
                            )
                        })

                    unit_price = (
                        product.discount_price
                        if (
                            product.discount_price is not None
                            and product.discount_price < product.price
                        )
                        else product.price
                    )

                    item_subtotal = unit_price * item.quantity
                    subtotal += item_subtotal

                    order_items_data.append({
                        "product": product,
                        "product_name": product.name,
                        "unit_price": unit_price,
                        "quantity": item.quantity,
                        "subtotal": item_subtotal,
                    })

                address_obj = None

                if data.get("address_id"):

                    try:
                        address_obj = Address.objects.select_for_update().get(
                            id=data["address_id"],
                            user=request.user
                        )

                    except Address.DoesNotExist:
                        raise serializers.ValidationError({
                            "address_id": (
                                "Address is no longer available."
                            )
                        })

                    delivery_address = {
                        "full_name": address_obj.full_name,
                        "phone": address_obj.phone,
                        "address_line": address_obj.address_line,
                        "city": address_obj.city,
                        "state": address_obj.state,
                        "pincode": address_obj.pincode,
                    }

                else:
                    delivery_address = data["delivery_address"]

                shipping_charge = Decimal("0.00")
                tax = Decimal("0.00")
                total_amount = subtotal + shipping_charge + tax

                if data["payment_method"] == Payment.Method.RAZORPAY:
                    initial_status = Order.Status.PENDING
                else:
                    initial_status = Order.Status.CONFIRMED

                order = Order.objects.create(
                    user=request.user,
                    checkout_key=checkout_key,
                    address=address_obj,
                    full_name=delivery_address["full_name"],
                    phone=delivery_address["phone"],
                    address_line=delivery_address["address_line"],
                    city=delivery_address["city"],
                    state=delivery_address["state"],
                    pincode=delivery_address["pincode"],
                    subtotal=subtotal,
                    shipping_charge=shipping_charge,
                    tax=tax,
                    total_amount=total_amount,
                    status=initial_status,
                )

                for item_data in order_items_data:

                    order_item = OrderItem.objects.create(
                        order=order,
                        product=item_data["product"],
                        product_name=item_data["product_name"],
                        unit_price=item_data["unit_price"],
                        quantity=item_data["quantity"],
                        subtotal=item_data["subtotal"],
                    )

                    updated = Product.objects.filter(
                        id=item_data["product"].id,
                        stock__gte=item_data["quantity"]
                    ).update(
                        stock=F("stock") - item_data["quantity"]
                    )

                    if updated != 1:
                        raise serializers.ValidationError({
                            "stock": (
                                f"Insufficient stock for "
                                f"{item_data['product_name']}."
                            )
                        })

                    StockAdjustment.objects.create(
                        order_item=order_item,
                        product=item_data["product"],
                        adjustment_type=(
                            StockAdjustment.AdjustmentType.DEDUCTION
                        ),
                        quantity=item_data["quantity"],
                        reference=(
                            f"order:{order.id}:"
                            f"item:{order_item.id}:DEDUCTION"
                        )
                    )

                # Create one pending response for each unique artisan.
                artisan_user_ids = {
                    item_data["product"].artisan.user_id
                    for item_data in order_items_data
                }

                ArtisanOrderResponse.objects.bulk_create([
                    ArtisanOrderResponse(
                        order=order,
                        artisan_id=artisan_user_id,
                        status=ArtisanOrderResponse.Status.PENDING,
                    )
                    for artisan_user_id in artisan_user_ids
                ])

                if data["payment_method"] == Payment.Method.COD:

                    Payment.objects.create(
                        order=order,
                        payment_method=Payment.Method.COD,
                        amount=total_amount,
                        status=Payment.Status.PENDING,
                    )

                elif data["payment_method"] == Payment.Method.RAZORPAY:

                    try:
                        razorpay_order = create_razorpay_order(
                            total_amount,
                            str(order.order_number)
                        )

                    except Exception as exc:
                        raise RazorpayOrderCreationError() from exc

                    Payment.objects.create(
                        order=order,
                        payment_method=Payment.Method.RAZORPAY,
                        amount=total_amount,
                        status=Payment.Status.PENDING,
                        razorpay_order_id=razorpay_order["id"],
                    )

                    razorpay_checkout_data = {
                        "key": settings.RAZORPAY_KEY_ID,
                        "razorpay_order_id": razorpay_order["id"],
                        "amount": razorpay_order["amount"],
                        "currency": razorpay_order["currency"],
                    }

                cart.items.all().delete()

            order_data = OrderSerializer(order).data

            if razorpay_checkout_data:

                return Response(
                    {
                        "order": order_data,
                        "razorpay": razorpay_checkout_data,
                    },
                    status=status.HTTP_201_CREATED
                )

            return Response(
                order_data,
                status=status.HTTP_201_CREATED
            )

        except RazorpayOrderCreationError:

            return Response(
                {
                    "error": (
                        "Unable to create Razorpay order. "
                        "Please try again."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

        except IntegrityError:

            existing_order = Order.objects.filter(
                checkout_key=checkout_key,
                user=request.user
            ).first()

            if existing_order:
                return Response(
                    OrderSerializer(existing_order).data,
                    status=status.HTTP_200_OK
                )

            raise

        except Cart.DoesNotExist:

            return Response(
                {"cart": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST
            )


class BuyNowCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can place orders."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BuyNowCheckoutSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        checkout_key = data["checkout_key"]

        existing_order = Order.objects.filter(
            checkout_key=checkout_key
        ).first()

        if existing_order:

            if existing_order.user_id != request.user.id:
                return Response(
                    {"error": "Invalid checkout key."},
                    status=status.HTTP_409_CONFLICT
                )

            return Response(
                OrderSerializer(existing_order).data,
                status=status.HTTP_200_OK
            )

        if data["payment_method"] == Payment.Method.RAZORPAY:

            if (
                not settings.RAZORPAY_KEY_ID
                or not settings.RAZORPAY_KEY_SECRET
            ):
                return Response(
                    {
                        "error": (
                            "Razorpay API keys are not configured. "
                            "Please try again later."
                        )
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

        razorpay_checkout_data = None

        try:
            with transaction.atomic():

                product = Product.objects.select_for_update().select_related(
                    "category",
                    "artisan__user"
                ).get(id=data["product_id"])

                quantity = data["quantity"]

                is_available = (
                    product.is_published
                    and not product.is_deleted
                    and not product.category.is_deleted
                    and product.artisan.verification_status == "APPROVED"
                    and product.artisan.user.is_active
                    and product.stock >= quantity
                )

                if not is_available:
                    raise serializers.ValidationError({
                        "product": (
                            f"{product.name} is unavailable "
                            "or has insufficient stock."
                        )
                    })

                if (
                    data["payment_method"] == Payment.Method.COD
                    and not product.allow_cod
                ):
                    raise serializers.ValidationError({
                        "payment_method": (
                            f"Cash on Delivery is not available "
                            f"for {product.name}. "
                            "Please choose online payment."
                        )
                    })

                if (
                    data["payment_method"] == Payment.Method.RAZORPAY
                    and not product.allow_online_payment
                ):
                    raise serializers.ValidationError({
                        "payment_method": (
                            f"Online payment is not available "
                            f"for {product.name}. "
                            "Please choose Cash on Delivery."
                        )
                    })

                unit_price = (
                    product.discount_price
                    if (
                        product.discount_price is not None
                        and product.discount_price < product.price
                    )
                    else product.price
                )

                subtotal = unit_price * quantity

                address_obj = None

                if data.get("address_id"):

                    try:
                        address_obj = Address.objects.select_for_update().get(
                            id=data["address_id"],
                            user=request.user
                        )
                    except Address.DoesNotExist:
                        raise serializers.ValidationError({
                            "address_id": (
                                "Address is no longer available."
                            )
                        })

                    delivery_address = {
                        "full_name": address_obj.full_name,
                        "phone": address_obj.phone,
                        "address_line": address_obj.address_line,
                        "city": address_obj.city,
                        "state": address_obj.state,
                        "pincode": address_obj.pincode,
                    }

                else:
                    delivery_address = data["delivery_address"]

                shipping_charge = Decimal("0.00")
                tax = Decimal("0.00")
                total_amount = subtotal + shipping_charge + tax

                if data["payment_method"] == Payment.Method.RAZORPAY:
                    initial_status = Order.Status.PENDING
                else:
                    initial_status = Order.Status.CONFIRMED

                order = Order.objects.create(
                    user=request.user,
                    checkout_key=checkout_key,
                    address=address_obj,
                    full_name=delivery_address["full_name"],
                    phone=delivery_address["phone"],
                    address_line=delivery_address["address_line"],
                    city=delivery_address["city"],
                    state=delivery_address["state"],
                    pincode=delivery_address["pincode"],
                    subtotal=subtotal,
                    shipping_charge=shipping_charge,
                    tax=tax,
                    total_amount=total_amount,
                    status=initial_status,
                )

                order_item = OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    unit_price=unit_price,
                    quantity=quantity,
                    subtotal=subtotal,
                )

                updated = Product.objects.filter(
                    id=product.id,
                    stock__gte=quantity
                ).update(
                    stock=F("stock") - quantity
                )

                if updated != 1:
                    raise serializers.ValidationError({
                        "stock": (
                            f"Insufficient stock for {product.name}."
                        )
                    })

                StockAdjustment.objects.create(
                    order_item=order_item,
                    product=product,
                    adjustment_type=(
                        StockAdjustment.AdjustmentType.DEDUCTION
                    ),
                    quantity=quantity,
                    reference=(
                        f"order:{order.id}:"
                        f"item:{order_item.id}:DEDUCTION"
                    )
                )

                # Create a pending response for this product's artisan.
                ArtisanOrderResponse.objects.create(
                    order=order,
                    artisan=product.artisan.user,
                    status=ArtisanOrderResponse.Status.PENDING,
                )

                if data["payment_method"] == Payment.Method.COD:

                    Payment.objects.create(
                        order=order,
                        payment_method=Payment.Method.COD,
                        amount=total_amount,
                        status=Payment.Status.PENDING,
                    )

                elif data["payment_method"] == Payment.Method.RAZORPAY:

                    try:
                        razorpay_order = create_razorpay_order(
                            total_amount,
                            str(order.order_number)
                        )

                    except Exception as exc:
                        raise RazorpayOrderCreationError() from exc

                    Payment.objects.create(
                        order=order,
                        payment_method=Payment.Method.RAZORPAY,
                        amount=total_amount,
                        status=Payment.Status.PENDING,
                        razorpay_order_id=razorpay_order["id"],
                    )

                    razorpay_checkout_data = {
                        "key": settings.RAZORPAY_KEY_ID,
                        "razorpay_order_id": razorpay_order["id"],
                        "amount": razorpay_order["amount"],
                        "currency": razorpay_order["currency"],
                    }

            order_data = OrderSerializer(order).data

            if razorpay_checkout_data:
                return Response(
                    {
                        "order": order_data,
                        "razorpay": razorpay_checkout_data,
                    },
                    status=status.HTTP_201_CREATED
                )

            return Response(
                order_data,
                status=status.HTTP_201_CREATED
            )

        except RazorpayOrderCreationError:

            return Response(
                {
                    "error": (
                        "Unable to create Razorpay order. "
                        "Please try again."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

        except IntegrityError:

            existing_order = Order.objects.filter(
                checkout_key=checkout_key,
                user=request.user
            ).first()

            if existing_order:
                return Response(
                    OrderSerializer(existing_order).data,
                    status=status.HTTP_200_OK
                )

            raise


class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):

        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can verify payments."},
                status=status.HTTP_403_FORBIDDEN
            )

        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")

        if not all([
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        ]):
            return Response(
                {"error": "All Razorpay payment details are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if (
            not settings.RAZORPAY_KEY_ID
            or not settings.RAZORPAY_KEY_SECRET
        ):
            return Response(
                {"error": "Razorpay API keys are not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            with transaction.atomic():

                order = Order.objects.select_for_update().get(
                    id=order_id,
                    user=request.user
                )

                payment = Payment.objects.select_for_update().get(
                    order=order,
                    payment_method=Payment.Method.RAZORPAY,
                    razorpay_order_id=razorpay_order_id
                )

                if payment.status == Payment.Status.SUCCESS:

                    if (
                        payment.signature_verified
                        and payment.razorpay_payment_id == razorpay_payment_id
                    ):
                        return Response(
                            {
                                "message": "Payment already verified.",
                                "order": OrderSerializer(order).data,
                            },
                            status=status.HTTP_200_OK
                        )

                    return Response(
                        {"error": "This payment has already been completed."},
                        status=status.HTTP_409_CONFLICT
                    )

                if order.status != Order.Status.PENDING:
                    return Response(
                        {"error": "This order cannot be verified."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                try:
                    verify_razorpay_signature(
                        razorpay_order_id,
                        razorpay_payment_id,
                        razorpay_signature
                    )

                except razorpay.errors.SignatureVerificationError:

                    payment.status = Payment.Status.FAILED
                    payment.failure_reason = "Invalid payment signature."
                    payment.save(
                        update_fields=["status", "failure_reason", "updated_at"]
                    )

                    return Response(
                        {"error": "Payment verification failed."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                except ValueError:
                    return Response(
                        {"error": "Razorpay API keys are not configured."},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE
                    )

                payment.razorpay_payment_id = razorpay_payment_id
                payment.signature_verified = True
                payment.status = Payment.Status.SUCCESS
                payment.failure_reason = ""

                payment.save(
                    update_fields=[
                        "razorpay_payment_id",
                        "signature_verified",
                        "status",
                        "failure_reason",
                        "updated_at",
                    ]
                )

                order.status = Order.Status.CONFIRMED
                order.save(update_fields=["status", "updated_at"])

            return Response(
                {
                    "message": "Payment verified successfully.",
                    "order": OrderSerializer(order).data,
                },
                status=status.HTTP_200_OK
            )

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        except Payment.DoesNotExist:
            return Response(
                {"error": "Matching Razorpay payment not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        except IntegrityError:
            return Response(
                {"error": "Payment details conflict with an existing payment."},
                status=status.HTTP_409_CONFLICT
            )


class RetryPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):

        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can retry payments."},
                status=status.HTTP_403_FORBIDDEN
            )

        if (
            not settings.RAZORPAY_KEY_ID
            or not settings.RAZORPAY_KEY_SECRET
        ):
            return Response(
                {"error": "Razorpay API keys are not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            with transaction.atomic():

                order = Order.objects.select_for_update().get(
                    id=order_id,
                    user=request.user
                )

                if order.status != Order.Status.PENDING:
                    return Response(
                        {"error": "Payment retry is not available for this order."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                latest_payment = order.payments.filter(
                    payment_method=Payment.Method.RAZORPAY
                ).order_by("-created_at").first()

                if latest_payment is None:
                    return Response(
                        {"error": "Razorpay payment record not found."},
                        status=status.HTTP_404_NOT_FOUND
                    )

                if latest_payment.status == Payment.Status.SUCCESS:
                    return Response(
                        {"error": "This order has already been paid."},
                        status=status.HTTP_409_CONFLICT
                    )

                if latest_payment.status != Payment.Status.FAILED:
                    return Response(
                        {
                            "error": (
                                "The previous payment must be marked "
                                "as failed before retrying."
                            )
                        },
                        status=status.HTTP_409_CONFLICT
                    )

                try:
                    razorpay_order = create_razorpay_order(
                        order.total_amount,
                        str(order.order_number)
                    )

                except Exception:
                    return Response(
                        {"error": "Unable to create a new Razorpay payment."},
                        status=status.HTTP_502_BAD_GATEWAY
                    )

                new_payment = Payment.objects.create(
                    order=order,
                    payment_method=Payment.Method.RAZORPAY,
                    amount=order.total_amount,
                    status=Payment.Status.PENDING,
                    razorpay_order_id=razorpay_order["id"],
                )

            return Response(
                {
                    "message": "New payment attempt created.",
                    "order_id": order.id,
                    "payment_id": new_payment.id,
                    "razorpay": {
                        "key": settings.RAZORPAY_KEY_ID,
                        "razorpay_order_id": razorpay_order["id"],
                        "amount": razorpay_order["amount"],
                        "currency": razorpay_order["currency"],
                    }
                },
                status=status.HTTP_201_CREATED
            )

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class MyOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can view their orders."},
                status=status.HTTP_403_FORBIDDEN
            )

        orders = Order.objects.filter(
            user=request.user
        ).prefetch_related(
            "items",
            "payments"
        )

        search = request.query_params.get("search", "").strip()

        if search:
            order_search = Q(order_number__icontains=search)

            short_number = search.upper().removeprefix("CRP-")

            if short_number.isdigit():
                order_search |= Q(id=int(short_number))

            orders = orders.filter(
                order_search |
                Q(status__icontains=search)
            )

        orders = orders.order_by("-created_at")

        serializer = OrderSerializer(orders, many=True)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):

        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can view order details."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            order = Order.objects.prefetch_related(
                "items",
                "payments"
            ).get(
                id=order_id,
                user=request.user
            )

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = OrderSerializer(order)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):

        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can cancel orders."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CancelOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reason = serializer.validated_data.get("reason", "")

        try:
            with transaction.atomic():

                order = Order.objects.select_for_update().get(
                    id=order_id,
                    user=request.user
                )

                if order.status not in [
                    Order.Status.PENDING,
                    Order.Status.CONFIRMED,
                ]:
                    return Response(
                        {"error": "This order cannot be cancelled."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                order_items = order.items.select_related(
                    "product"
                ).order_by("id")

                for item in order_items:

                    if not item.product_id:
                        raise serializers.ValidationError({
                            "product": (
                                f"Product for {item.product_name} "
                                "is unavailable for stock restoration."
                            )
                        })

                    product = Product.objects.select_for_update().get(
                        id=item.product_id
                    )

                    Product.objects.filter(
                        id=product.id
                    ).update(
                        stock=F("stock") + item.quantity
                    )

                    StockAdjustment.objects.create(
                        order_item=item,
                        product=product,
                        adjustment_type=(
                            StockAdjustment.AdjustmentType
                            .CANCELLATION_RESTORATION
                        ),
                        quantity=item.quantity,
                        reference=(
                            f"order:{order.id}:"
                            f"item:{item.id}:"
                            "CANCELLATION_RESTORATION"
                        )
                    )

                order.status = Order.Status.CANCELLED
                order.cancellation_reason = reason

                order.save(
                    update_fields=[
                        "status",
                        "cancellation_reason",
                        "updated_at",
                    ]
                )

            return Response(
                OrderSerializer(order).data,
                status=status.HTTP_200_OK
            )

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_400_BAD_REQUEST
            )


class ReturnRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):

        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can request returns."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            order = Order.objects.get(
                id=order_id,
                user=request.user
            )

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if order.status != Order.Status.DELIVERED:
            return Response(
                {"error": "Only delivered orders can be returned."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if order.return_requests.exists():
            return Response(
                {
                    "error": (
                        "A return request already exists "
                        "for this order."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ReturnRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return_request = serializer.save(order=order)

        return Response(
            ReturnRequestSerializer(return_request).data,
            status=status.HTTP_201_CREATED
        )


class AdminReturnRequestListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):

        return_requests = ReturnRequest.objects.select_related(
            "order",
            "order__user",
            "reviewed_by"
        ).order_by("-created_at")

        result = []

        for item in return_requests:
            result.append({
                "id": item.id,
                "order_id": item.order.id,
                "order_number": str(item.order.order_number),
                "customer": {
                    "id": item.order.user.id,
                    "username": item.order.user.username,
                    "email": item.order.user.email,
                },
                "reason": item.reason,
                "status": item.status,
                "admin_note": item.admin_note,
                "reviewed_by": (
                    item.reviewed_by.username
                    if item.reviewed_by else None
                ),
                "reviewed_at": item.reviewed_at,
                "created_at": item.created_at,
            })

        return Response(
            result,
            status=status.HTTP_200_OK
        )


class AdminReturnRequestUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, return_id):

        new_status = str(
            request.data.get("status", "")
        ).strip().upper()

        admin_note = request.data.get("admin_note", "")

        allowed_statuses = [
            ReturnRequest.Status.APPROVED,
            ReturnRequest.Status.REJECTED,
            ReturnRequest.Status.COMPLETED,
        ]

        if new_status not in allowed_statuses:
            return Response(
                {
                    "error": (
                        "Status must be APPROVED, REJECTED "
                        "or COMPLETED."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():

                return_request = ReturnRequest.objects.select_for_update().get(
                    id=return_id
                )

                if new_status in [
                    ReturnRequest.Status.APPROVED,
                    ReturnRequest.Status.REJECTED,
                ]:

                    if return_request.status != ReturnRequest.Status.PENDING:
                        return Response(
                            {
                                "error": "This return request has already been reviewed.",
                                "current_status": return_request.status,
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    return_request.status = new_status
                    return_request.admin_note = admin_note
                    return_request.reviewed_by = request.user
                    return_request.reviewed_at = timezone.now()

                    return_request.save(
                        update_fields=[
                            "status",
                            "admin_note",
                            "reviewed_by",
                            "reviewed_at",
                            "updated_at",
                        ]
                    )

                else:

                    if return_request.status != ReturnRequest.Status.APPROVED:
                        return Response(
                            {
                                "error": "Only approved return requests can be completed.",
                                "current_status": return_request.status,
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    order = Order.objects.select_for_update().get(
                        id=return_request.order_id
                    )

                    order_items = order.items.order_by("id")

                    for item in order_items:

                        if not item.product_id:
                            raise serializers.ValidationError({
                                "product": (
                                    f"Product for {item.product_name} "
                                    "is unavailable for stock restoration."
                                )
                            })

                        product = Product.objects.select_for_update().get(
                            id=item.product_id
                        )

                        reference = (
                            f"return:{return_request.id}:"
                            f"item:{item.id}:"
                            "RETURN_RESTORATION"
                        )

                        adjustment_exists = StockAdjustment.objects.filter(
                            reference=reference
                        ).exists()

                        if not adjustment_exists:

                            product.stock += item.quantity

                            product.save(
                                update_fields=["stock", "updated_at"]
                            )

                            StockAdjustment.objects.create(
                                order_item=item,
                                product=product,
                                adjustment_type=(
                                    StockAdjustment.AdjustmentType
                                    .RETURN_RESTORATION
                                ),
                                quantity=item.quantity,
                                reference=reference,
                            )

                    return_request.status = ReturnRequest.Status.COMPLETED
                    return_request.completed_at = timezone.now()

                    if "admin_note" in request.data:
                        return_request.admin_note = admin_note

                    return_request.save(
                        update_fields=[
                            "status",
                            "completed_at",
                            "admin_note",
                            "updated_at",
                        ]
                    )

            return Response(
                {
                    "message": "Return request updated successfully.",
                    "return_request_id": return_request.id,
                    "order_id": return_request.order_id,
                    "status": return_request.status,
                    "admin_note": return_request.admin_note,
                    "completed_at": return_request.completed_at,
                },
                status=status.HTTP_200_OK
            )

        except ReturnRequest.DoesNotExist:
            return Response(
                {"error": "Return request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_400_BAD_REQUEST
            )


class InvoicePDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):

        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can download invoices."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            order = Order.objects.prefetch_related(
                "items"
            ).get(
                id=order_id,
                user=request.user
            )

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        buffer = BytesIO()

        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=20 * mm,
            leftMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm,
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "InvoiceTitle",
            parent=styles["Title"],
            alignment=TA_CENTER,
            textColor=colors.HexColor("#5C3A2E"),
            fontSize=22,
            spaceAfter=15,
        )

        normal_style = styles["Normal"]
        elements = []

        elements.append(
            Paragraph("CRAFTOPIA", title_style)
        )

        elements.append(
            Paragraph(
                "INVOICE",
                ParagraphStyle(
                    "InvoiceHeading",
                    parent=styles["Heading2"],
                    alignment=TA_CENTER,
                    textColor=colors.HexColor("#8B6248"),
                )
            )
        )

        elements.append(Spacer(1, 15))

        order_data = [
            ["Order Number", f"CRP-{order.id:05d}"],
            ["Order Date", order.created_at.strftime("%d-%m-%Y")],
            ["Order Status", order.status],
        ]

        order_table = Table(
            order_data,
            colWidths=[45 * mm, 115 * mm]
        )

        order_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F8F4ED")),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#5C3A2E")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("PADDING", (0, 0), (-1, -1), 8),
        ]))

        elements.append(order_table)
        elements.append(Spacer(1, 15))

        elements.append(
            Paragraph(
                "Customer & Delivery Details",
                styles["Heading2"]
            )
        )

        address_text = (
            f"<b>{escape(order.full_name)}</b><br/>"
            f"{escape(order.phone)}<br/>"
            f"{escape(order.address_line)}<br/>"
            f"{escape(order.city)}, {escape(order.state)} - "
            f"{escape(order.pincode)}"
        )

        elements.append(
            Paragraph(address_text, normal_style)
        )

        elements.append(Spacer(1, 20))

        elements.append(
            Paragraph("Order Items", styles["Heading2"])
        )

        item_data = [
            ["Product", "Unit Price", "Quantity", "Subtotal"]
        ]

        for item in order.items.all():

            item_data.append([
                Paragraph(escape(item.product_name), normal_style),
                f"INR {item.unit_price}",
                str(item.quantity),
                f"INR {item.subtotal}",
            ])

        item_table = Table(
            item_data,
            colWidths=[65 * mm, 35 * mm, 25 * mm, 35 * mm],
            repeatRows=1,
        )

        item_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#5C3A2E")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("PADDING", (0, 0), (-1, -1), 7),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ]))

        elements.append(item_table)
        elements.append(Spacer(1, 20))

        total_data = [
            ["Subtotal", f"INR {order.subtotal}"],
            ["Shipping Charge", f"INR {order.shipping_charge}"],
            ["Tax", f"INR {order.tax}"],
            ["Total Amount", f"INR {order.total_amount}"],
        ]

        total_table = Table(
            total_data,
            colWidths=[120 * mm, 40 * mm],
            hAlign="RIGHT",
        )

        total_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("PADDING", (0, 0), (-1, -1), 8),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#F8F4ED")),
            ("TEXTCOLOR", (0, -1), (-1, -1), colors.HexColor("#5C3A2E")),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ]))

        elements.append(total_table)
        elements.append(Spacer(1, 25))

        elements.append(
            Paragraph(
                "Thank you for shopping with Craftopia!",
                ParagraphStyle(
                    "Footer",
                    parent=normal_style,
                    alignment=TA_CENTER,
                    textColor=colors.HexColor("#8B6248"),
                )
            )
        )

        document.build(elements)

        pdf = buffer.getvalue()
        buffer.close()

        response = HttpResponse(
            pdf,
            content_type="application/pdf"
        )

        response["Content-Disposition"] = (
            f'attachment; filename="Craftopia_Invoice_{order.id}.pdf"'
        )

        return response



class AdminOrderListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):

        orders = Order.objects.select_related(
            "user"
        ).prefetch_related(
            "items",
            "payments"
        ).order_by("-created_at")

        # Search
        search = request.query_params.get("search", "").strip()
        order_status = request.query_params.get(
            "status", ""
        ).strip().upper()

        if search:
            order_search = Q(order_number__icontains=search)

            short_number = search.upper().removeprefix("CRP-")

            if short_number.isdigit():
                order_search |= Q(id=int(short_number))

            orders = orders.filter(
                order_search |
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search) |
                Q(full_name__icontains=search) |
                Q(phone__icontains=search)
            )

        # Status filter
        if order_status:
            valid_statuses = [
                choice[0] for choice in Order.Status.choices
            ]

            if order_status not in valid_statuses:
                return Response(
                    {"error": "Invalid order status."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            orders = orders.filter(status=order_status)

        # Sorting
        sort_by = request.query_params.get(
            "sort_by", "created_at"
        )

        allowed_sort_fields = [
            "created_at",
            "total_amount",
            "status",
            "order_number",
        ]

        if sort_by not in allowed_sort_fields:
            return Response(
                {"error": "Invalid sorting field."},
                status=status.HTTP_400_BAD_REQUEST
            )

        sort_order = request.query_params.get(
            "sort_order", "desc"
        ).lower()

        if sort_order not in ["asc", "desc"]:
            return Response(
                {"error": "Invalid sorting order."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if sort_order == "desc":
            sort_by = f"-{sort_by}"

        orders = orders.order_by(sort_by, "-id")

        # Pagination
        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = int(
                request.query_params.get("page_size", 10)
            )

            if page_size < 1 or page_size > 50:
                raise ValueError

        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid pagination parameters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        paginator = Paginator(orders, page_size)
        current_page = paginator.get_page(page)

        result = []

        for order in current_page.object_list:

            result.append({
                "id": order.id,
                "order_number": f"CRP-{order.id:05d}",
                "customer": {
                    "id": order.user.id,
                    "username": order.user.username,
                    "first_name": order.user.first_name,
                    "last_name": order.user.last_name,
                    "email": order.user.email,
                },
                "full_name": order.full_name,
                "phone": order.phone,
                "address_line": order.address_line,
                "city": order.city,
                "state": order.state,
                "pincode": order.pincode,
                "subtotal": order.subtotal,
                "shipping_charge": order.shipping_charge,
                "tax": order.tax,
                "total_amount": order.total_amount,
                "status": order.status,
                "created_at": order.created_at,
                "items_count": order.items.count(),
            })

        return Response({
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": current_page.number,
            "page_size": page_size,
            "next": current_page.has_next(),
            "previous": current_page.has_previous(),
            "results": result,
        }, status=status.HTTP_200_OK)
    
class AdminOrderDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, order_id):

        try:
            order = Order.objects.select_related(
                "user"
            ).prefetch_related(
                "items",
                "payments"
            ).get(id=order_id)

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        items = []

        for item in order.items.all():

            items.append({
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "unit_price": item.unit_price,
                "quantity": item.quantity,
                "subtotal": item.subtotal,
            })

        payments = []

        for payment in order.payments.all():

            payments.append({
                "id": payment.id,
                "payment_method": payment.payment_method,
                "amount": payment.amount,
                "status": payment.status,
                "created_at": payment.created_at,
            })

        return Response(
            {
                "id": order.id,
                "order_number": f"CRP-{order.id:05d}",
                "customer": {
                    "id": order.user.id,
                    "username": order.user.username,
                    "first_name": order.user.first_name,
                    "last_name": order.user.last_name,
                    "email": order.user.email,
                },
                "delivery_address": {
                    "full_name": order.full_name,
                    "phone": order.phone,
                    "address_line": order.address_line,
                    "city": order.city,
                    "state": order.state,
                    "pincode": order.pincode,
                },
                "items": items,
                "subtotal": order.subtotal,
                "shipping_charge": order.shipping_charge,
                "tax": order.tax,
                "total_amount": order.total_amount,
                "status": order.status,
                "cancellation_reason": order.cancellation_reason,
                "payments": payments,
                "created_at": order.created_at,
                "updated_at": order.updated_at,
            },
            status=status.HTTP_200_OK
        )


class AdminOrderStatusUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, order_id):

        new_status = request.data.get("status", "").strip().upper()

        allowed_transitions = {
            Order.Status.CONFIRMED: Order.Status.SHIPPED,
            Order.Status.SHIPPED: Order.Status.OUT_FOR_DELIVERY,
            Order.Status.OUT_FOR_DELIVERY: Order.Status.DELIVERED,
        }

        try:
            order = Order.objects.get(id=order_id)

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if new_status not in Order.Status.values:
            return Response(
                {"error": "Invalid order status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        expected_status = allowed_transitions.get(order.status)

        if expected_status is None:
            return Response(
                {
                    "error": "This order cannot be updated.",
                    "current_status": order.status,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status != expected_status:
            return Response(
                {
                    "error": "Invalid status transition.",
                    "current_status": order.status,
                    "allowed_next_status": expected_status,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "message": "Order status updated successfully.",
                "order_id": order.id,
               "order_number": f"CRP-{order.id:05d}",
                "status": order.status,
            },
            status=status.HTTP_200_OK
        )


class AdminPaymentListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):

        payments = Payment.objects.select_related(
            "order",
            "order__user"
        ).order_by("-created_at")

        search = request.query_params.get("search", "").strip()
        payment_method = request.query_params.get(
            "method", ""
        ).strip().upper()
        payment_status = request.query_params.get(
            "status", ""
        ).strip().upper()

        # Search
        if search:
            order_search = Q(order__order_number__icontains=search)

            short_number = search.upper().removeprefix("CRP-")

            if short_number.isdigit():
                order_search |= Q(order__id=int(short_number))

            payments = payments.filter(
                order_search |
                Q(order__user__username__icontains=search) |
                Q(order__user__email__icontains=search) |
                Q(order__full_name__icontains=search) |
                Q(order__phone__icontains=search) |
                Q(razorpay_order_id__icontains=search) |
                Q(razorpay_payment_id__icontains=search)
            )

        # Payment method filter
        if payment_method:
            valid_methods = [
                choice[0] for choice in Payment.Method.choices
            ]

            if payment_method not in valid_methods:
                return Response(
                    {"error": "Invalid payment method."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            payments = payments.filter(
                payment_method=payment_method
            )

        # Payment status filter
        if payment_status:
            valid_statuses = [
                choice[0] for choice in Payment.Status.choices
            ]

            if payment_status not in valid_statuses:
                return Response(
                    {"error": "Invalid payment status."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            payments = payments.filter(
                status=payment_status
            )

        result = []

        for payment in payments:

            order = payment.order
            customer = order.user

            result.append({
                "id": payment.id,
                "order": {
                    "id": order.id,
                    "order_number": f"CRP-{order.id:05d}",
                    "total_amount": order.total_amount,
                    "order_status": order.status,
                },
                "customer": {
                    "id": customer.id,
                    "username": customer.username,
                    "first_name": customer.first_name,
                    "last_name": customer.last_name,
                    "email": customer.email,
                },
                "payment_method": payment.payment_method,
                "amount": payment.amount,
                "status": payment.status,
                "razorpay_order_id": payment.razorpay_order_id,
                "razorpay_payment_id": payment.razorpay_payment_id,
                "razorpay_refund_id": payment.razorpay_refund_id,
                "signature_verified": payment.signature_verified,
                "failure_reason": payment.failure_reason,
                "created_at": payment.created_at,
                "updated_at": payment.updated_at,
            })

        return Response(
            result,
            status=status.HTTP_200_OK
        )

# ---------------------------------------------------------
# ARTISAN ORDER APIs
# ---------------------------------------------------------

def get_artisan_item_data(item, request):
    """
    Return one artisan's order item and its product images.
    """

    image_urls = []

    if item.product_id:

        for product_image in item.product.images.all():

            if product_image.image:
                image_urls.append(
                    request.build_absolute_uri(
                        product_image.image.url
                    )
                )

    return {
        "id": item.id,
        "product_id": item.product_id,
        "product_name": item.product_name,
        "unit_price": item.unit_price,
        "quantity": item.quantity,
        "subtotal": item.subtotal,
        "images": image_urls,
        "image": image_urls[0] if image_urls else None,
    }


class ArtisanOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "ARTISAN":
            return Response(
                {"error": "Only artisans can view order requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        artisan = ArtisanProfile.objects.filter(
            user=request.user,
            verification_status="APPROVED"
        ).first()

        if not artisan or not request.user.is_active:
            return Response(
                {"error": "Approved artisan profile not found."},
                status=status.HTTP_403_FORBIDDEN
            )

        artisan_items = OrderItem.objects.filter(
            product__artisan=artisan
        ).select_related(
            "product"
        ).prefetch_related(
            "product__images"
        ).order_by("id")

        orders = Order.objects.filter(
            items__product__artisan=artisan
        ).distinct().prefetch_related(
            Prefetch(
                "items",
                queryset=artisan_items,
                to_attr="artisan_order_items"
            ),
            Prefetch(
                "artisan_responses",
                queryset=ArtisanOrderResponse.objects.filter(
                    artisan=request.user
                ),
                to_attr="current_artisan_responses"
            )
        ).order_by("-created_at")

        search = request.query_params.get(
            "search", ""
        ).strip()

        # Search
        if search:
            order_search = Q(order_number__icontains=search)

            short_number = search.upper().removeprefix("CRP-")

            if short_number.isdigit():
                order_search |= Q(id=int(short_number))

            orders = orders.filter(
                order_search |
                Q(full_name__icontains=search) |
                Q(phone__icontains=search) |
                Q(items__product_name__icontains=search)
            ).distinct()

        result = []

        for order in orders:

            items = order.artisan_order_items

            artisan_subtotal = sum(
                (item.subtotal for item in items),
                Decimal("0.00")
            )

            artisan_response = (
                order.current_artisan_responses[0]
                if order.current_artisan_responses
                else None
            )

            result.append({
                "id": order.id,
                "order_number": f"CRP-{order.id:05d}",

                "customer": {
                    "full_name": order.full_name,
                },

                "delivery_address": {
                    "full_name": order.full_name,
                    "phone": order.phone,
                    "address_line": order.address_line,
                    "city": order.city,
                    "state": order.state,
                    "pincode": order.pincode,
                },

                "items": [
                    get_artisan_item_data(item, request)
                    for item in items
                ],

                "items_count": len(items),
                "artisan_subtotal": artisan_subtotal,
                "order_status": order.status,

                "artisan_response": {
                    "id": artisan_response.id,
                    "status": artisan_response.status,
                    "rejection_reason": artisan_response.rejection_reason,
                    "response_note": artisan_response.response_note,
                    "responded_at": artisan_response.responded_at,
                } if artisan_response else None,

                "created_at": order.created_at,
            })

        return Response(
            result,
            status=status.HTTP_200_OK
        )


class ArtisanOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):

        if request.user.role != "ARTISAN":
            return Response(
                {"error": "Only artisans can view order details."},
                status=status.HTTP_403_FORBIDDEN
            )

        artisan = ArtisanProfile.objects.filter(
            user=request.user,
            verification_status="APPROVED"
        ).first()

        if not artisan or not request.user.is_active:
            return Response(
                {"error": "Approved artisan profile not found."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            order = Order.objects.prefetch_related(
                Prefetch(
                    "items",
                    queryset=OrderItem.objects.filter(
                        product__artisan=artisan
                    ).select_related(
                        "product"
                    ).prefetch_related(
                        "product__images"
                    ),
                    to_attr="artisan_order_items"
                ),
                Prefetch(
                    "artisan_responses",
                    queryset=ArtisanOrderResponse.objects.filter(
                        artisan=request.user
                    ),
                    to_attr="current_artisan_responses"
                )
            ).get(
                id=order_id,
                items__product__artisan=artisan
            )

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        items = order.artisan_order_items

        artisan_subtotal = sum(
            (item.subtotal for item in items),
            Decimal("0.00")
        )

        artisan_response = (
            order.current_artisan_responses[0]
            if order.current_artisan_responses
            else None
        )

        result = {
            "id": order.id,
            "order_number": f"CRP-{order.id:05d}",

            "customer": {
                "full_name": order.full_name,
            },

            "delivery_address": {
                "full_name": order.full_name,
                "phone": order.phone,
                "address_line": order.address_line,
                "city": order.city,
                "state": order.state,
                "pincode": order.pincode,
            },

            "items": [
                get_artisan_item_data(item, request)
                for item in items
            ],

            "items_count": len(items),
            "artisan_subtotal": artisan_subtotal,
            "order_status": order.status,

            "artisan_response": {
                "id": artisan_response.id,
                "status": artisan_response.status,
                "rejection_reason": artisan_response.rejection_reason,
                "response_note": artisan_response.response_note,
                "responded_at": artisan_response.responded_at,
            } if artisan_response else None,

            "created_at": order.created_at,
            "updated_at": order.updated_at,
        }

        return Response(
            result,
            status=status.HTTP_200_OK
        )
class ArtisanAcceptOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):

        if getattr(request.user, "role", None) != "ARTISAN":
            return Response(
                {"detail": "Only artisans can accept order requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        with transaction.atomic():

            artisan_response = (
                ArtisanOrderResponse.objects
                .select_for_update()
                .filter(
                    order_id=order_id,
                    artisan=request.user
                )
                .first()
            )

            if not artisan_response:
                return Response(
                    {"detail": "Order request not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            if artisan_response.status != ArtisanOrderResponse.Status.PENDING:
                return Response(
                    {"detail": "You have already responded to this order."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if artisan_response.order.status == Order.Status.CANCELLED:
                return Response(
                    {"detail": "This order has been cancelled."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            payment = (
                Payment.objects
                .select_for_update()
                .filter(order_id=order_id)
                .order_by("-created_at")
                .first()
            )

            if not payment:
                return Response(
                    {"detail": "Payment record not found."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if (
                payment.payment_method == Payment.Method.RAZORPAY
                and payment.status != Payment.Status.SUCCESS
            ):
                return Response(
                    {"detail": "Customer payment is not completed yet."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            artisan_response.status = ArtisanOrderResponse.Status.ACCEPTED
            artisan_response.responded_at = timezone.now()

            artisan_response.save(
                update_fields=["status", "responded_at", "updated_at"]
            )

        return Response(
            {
                "message": "Order request accepted successfully.",
                "order_id": order_id,
                "response_status": artisan_response.status
            },
            status=status.HTTP_200_OK
        )    

class ArtisanRejectOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):

        if getattr(request.user, "role", None) != "ARTISAN":
            return Response(
                {"detail": "Only artisans can reject order requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        reason = request.data.get("rejection_reason", "")
        note = request.data.get("response_note", "").strip()

        valid_reasons = [
            choice[0]
            for choice in ArtisanOrderResponse.RejectionReason.choices
        ]

        if reason not in valid_reasons:
            return Response(
                {"detail": "Please provide a valid rejection reason."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if reason == ArtisanOrderResponse.RejectionReason.OTHER and not note:
            return Response(
                {"detail": "Please explain the rejection reason."},
                status=status.HTTP_400_BAD_REQUEST
            )

        refund_record = None
        payment = None

        with transaction.atomic():

            artisan_response = (
                ArtisanOrderResponse.objects
                .select_for_update()
                .filter(
                    order_id=order_id,
                    artisan=request.user
                )
                .first()
            )

            if not artisan_response:
                return Response(
                    {"detail": "Order request not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            if artisan_response.status != ArtisanOrderResponse.Status.PENDING:
                return Response(
                    {"detail": "You have already responded to this order."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            order = (
                Order.objects
                .select_for_update()
                .get(pk=order_id)
            )

            if order.status == Order.Status.CANCELLED:
                return Response(
                    {"detail": "This order has been cancelled."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            artisan_items = list(
                OrderItem.objects
                .select_for_update()
                .filter(
                    order=order,
                    product__artisan__user_id=request.user.id
                )
                .select_related("product")
            )

            if not artisan_items:
                return Response(
                    {"detail": "No products found for this artisan in this order."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Find the successful Razorpay payment, if available.
            payment = (
                Payment.objects
                .select_for_update()
                .filter(
                    order=order,
                    payment_method=Payment.Method.RAZORPAY,
                    status=Payment.Status.SUCCESS
                )
                .order_by("-created_at")
                .first()
            )

            if payment is None:
                cod_payment = (
                    Payment.objects
                    .filter(
                        order=order,
                        payment_method=Payment.Method.COD
                    )
                    .order_by("-created_at")
                    .first()
                )

                if cod_payment:
                    payment = cod_payment
                else:
                    return Response(
                        {
                            "detail": (
                                "Payment is not completed. "
                                "The artisan cannot reject this request yet."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Calculate this artisan's product subtotal.
            artisan_subtotal = sum(
                (item.subtotal for item in artisan_items),
                Decimal("0.00")
            )

            if order.subtotal <= 0 or artisan_subtotal <= 0:
                return Response(
                    {"detail": "Unable to calculate the artisan refund amount."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Allocate shipping and tax proportionally.
            shipping_share = (
                order.shipping_charge * artisan_subtotal / order.subtotal
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            tax_share = (
                order.tax * artisan_subtotal / order.subtotal
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            refund_amount = (
                artisan_subtotal + shipping_share + tax_share
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            # Restore stock only for this artisan's products.
            for item in artisan_items:

                if not item.product_id:
                    continue

                reference = (
                    f"order:{order.id}:item:{item.id}:"
                    "ARTISAN_REJECTION_RESTORATION"
                )

                adjustment_exists = StockAdjustment.objects.filter(
                    reference=reference
                ).exists()

                if not adjustment_exists:

                    StockAdjustment.objects.create(
                        order_item=item,
                        product_id=item.product_id,
                        adjustment_type=(
                            StockAdjustment.AdjustmentType
                            .ARTISAN_REJECTION_RESTORATION
                        ),
                        quantity=item.quantity,
                        reference=reference
                    )

                    Product.objects.filter(
                        pk=item.product_id
                    ).update(
                        stock=F("stock") + item.quantity
                    )

            # Create a separate refund record for Razorpay.
            if payment.payment_method == Payment.Method.RAZORPAY:

                if not payment.razorpay_payment_id:
                    return Response(
                        {"detail": "Razorpay payment reference is missing."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                previous_refunds = payment.artisan_refunds.exclude(
                    status=ArtisanRefund.Status.FAILED
                )

                already_allocated = sum(
                    previous_refunds.values_list("amount", flat=True),
                    Decimal("0.00")
                )

                available_amount = payment.amount - already_allocated

                if refund_amount > available_amount:
                    return Response(
                        {
                            "detail": (
                                "The calculated refund exceeds the "
                                "remaining refundable payment amount."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                refund_record = ArtisanRefund.objects.create(
                    payment=payment,
                    artisan_response=artisan_response,
                    amount=refund_amount,
                    status=ArtisanRefund.Status.PENDING
                )

            # Update only this artisan's response.
            artisan_response.status = ArtisanOrderResponse.Status.REJECTED
            artisan_response.rejection_reason = reason
            artisan_response.response_note = note
            artisan_response.responded_at = timezone.now()

            artisan_response.save(
                update_fields=[
                    "status",
                    "rejection_reason",
                    "response_note",
                    "responded_at",
                    "updated_at"
                ]
            )

        # Razorpay API call happens after the database transaction commits.
        if refund_record:

            try:
                razorpay_result = create_razorpay_refund(
                    payment.razorpay_payment_id,
                    refund_record.amount
                )

                razorpay_status = razorpay_result.get("status", "pending")
                razorpay_refund_id = razorpay_result.get("id")

                refund_record.razorpay_refund_id = razorpay_refund_id

                if razorpay_status == "processed":
                    refund_record.status = ArtisanRefund.Status.PROCESSED

                elif razorpay_status == "failed":
                    refund_record.status = ArtisanRefund.Status.FAILED
                    refund_record.failure_reason = (
                        "Razorpay reported that the refund failed."
                    )

                else:
                    refund_record.status = ArtisanRefund.Status.PENDING

                refund_record.save(
                    update_fields=[
                        "razorpay_refund_id",
                        "status",
                        "failure_reason",
                        "updated_at"
                    ]
                )

                if refund_record.status == ArtisanRefund.Status.PROCESSED:

                    processed_total = sum(
                        payment.artisan_refunds.filter(
                            status=ArtisanRefund.Status.PROCESSED
                        ).values_list("amount", flat=True),
                        Decimal("0.00")
                    )

                    if processed_total >= payment.amount:
                        payment.status = Payment.Status.REFUNDED

                elif refund_record.status == ArtisanRefund.Status.PENDING:
                    payment.status = Payment.Status.REFUND_PENDING

                elif refund_record.status == ArtisanRefund.Status.FAILED:
                    payment.status = Payment.Status.REFUND_FAILED

                payment.save(update_fields=["status", "updated_at"])

            except Exception as exc:
                # Keep the refund PENDING if Razorpay's result is uncertain.
                # Do not automatically submit another refund request.
                refund_record.failure_reason = str(exc)
                refund_record.save(
                    update_fields=["failure_reason", "updated_at"]
                )

                return Response(
                    {
                        "message": "Order rejected. Refund confirmation is pending.",
                        "response_status": artisan_response.status,
                        "refund_status": refund_record.status
                    },
                    status=status.HTTP_202_ACCEPTED
                )

            return Response(
                {
                    "message": "Order rejected successfully.",
                    "response_status": artisan_response.status,
                    "rejection_reason": reason,
                    "refund_amount": str(refund_record.amount),
                    "refund_status": refund_record.status
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "message": "Order rejected successfully.",
                "response_status": artisan_response.status,
                "rejection_reason": reason,
                "refund_amount": "0.00",
                "refund_status": "NOT_REQUIRED"
            },
            status=status.HTTP_200_OK
        )
class MarkCODPaymentCollectedView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, payment_id):

        try:
            with transaction.atomic():

                payment = Payment.objects.select_for_update().select_related(
                    "order"
                ).get(id=payment_id)

                if payment.payment_method != Payment.Method.COD:
                    return Response(
                        {"error": "This is not a COD payment."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if payment.status == Payment.Status.SUCCESS:
                    return Response(
                        {"error": "This COD payment is already collected."},
                        status=status.HTTP_409_CONFLICT
                    )

                if payment.status != Payment.Status.PENDING:
                    return Response(
                        {"error": "This payment cannot be marked as collected."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if payment.order.status != Order.Status.DELIVERED:
                    return Response(
                        {
                            "error": (
                                "COD payment can be collected only "
                                "after the order is delivered."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                payment.status = Payment.Status.SUCCESS
                payment.cod_collected_at = timezone.now()
                payment.cod_collected_by = request.user

                payment.save(
                    update_fields=[
                        "status",
                        "cod_collected_at",
                        "cod_collected_by",
                    ]
                )

            return Response(
                {
                    "message": "COD payment marked as collected successfully.",
                    "payment_id": payment.id,
                    "status": payment.status,
                    "cod_collected_at": payment.cod_collected_at,
                    "cod_collected_by": request.user.username,
                },
                status=status.HTTP_200_OK
            )

        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND
            )    