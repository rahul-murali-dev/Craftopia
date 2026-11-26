
from rest_framework import serializers
from decimal import Decimal

from product.models import Cart, Product
from users.models import Address

from .models import (
    Order,
    OrderItem,
    Payment,
    ReturnRequest,
    Coupon,
    CouponUsage,
)



class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "unit_price",
            "quantity",
            "subtotal",
            "is_cancelled",
            "cancellation_reason",
            "cancelled_at",
            "created_at",
        ]
        read_only_fields = fields

    def get_product(self, obj):
        if not obj.product:
            return None

        request = self.context.get("request")
        images = []

        for product_image in obj.product.images.all():
            image_url = product_image.image.url

            if request:
                image_url = request.build_absolute_uri(image_url)

            images.append({
                "id": product_image.id,
                "image": image_url,
            })

        return {
            "id": obj.product.id,
            "name": obj.product.name,
            "images": images,
        }


class OrderSerializer(serializers.ModelSerializer):
    order_number = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)
    return_request = serializers.SerializerMethodField()
    payment = serializers.SerializerMethodField()

    def get_order_number(self, obj):
        return f"CRP-{obj.id:05d}"

    def get_payment(self, obj):
        latest_payment = obj.payments.order_by(
            "-created_at",
            "-id"
        ).first()

        if not latest_payment:
            return None

        return {
            "id": latest_payment.id,
            "payment_method": latest_payment.payment_method,
            "status": latest_payment.status,
            "amount": latest_payment.amount,
            "failure_reason": latest_payment.failure_reason,
        }

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "address",
            "full_name",
            "phone",
            "address_line",
            "city",
            "state",
            "pincode",
            "subtotal",
            "coupon_code",
            "discount_amount",
            "shipping_charge",
            "tax",
            "total_amount",
            "status",
            "payment",
            "cancellation_reason",
            "items",
            "return_request",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_return_request(self, obj):
        return_request = obj.return_requests.first()

        if not return_request:
            return None

        return {
            "id": return_request.id,
            "reason": return_request.reason,
            "status": return_request.status,
            "admin_note": return_request.admin_note,
            "created_at": return_request.created_at,
            "updated_at": return_request.updated_at,
            "reviewed_at": return_request.reviewed_at,
            "completed_at": return_request.completed_at,
        }

class CheckoutAddressSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)
    address_line = serializers.CharField()
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.CharField(max_length=10)


class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(required=False)
    address = CheckoutAddressSerializer(required=False)
    checkout_key = serializers.UUIDField()
    payment_method = serializers.ChoiceField(
        choices=Payment.Method.choices
    )
    coupon_code = serializers.CharField(
        required=False,
        allow_blank=True,
        default=""
    )

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user

        address_id = attrs.get("address_id")
        new_address = attrs.get("address")

        if bool(address_id) == bool(new_address):
            raise serializers.ValidationError(
                "Select an existing address or provide a new address."
            )

        if address_id:
            try:
                saved_address = Address.objects.get(
                    id=address_id,
                    user=user
                )
            except Address.DoesNotExist:
                raise serializers.ValidationError({
                    "address_id": "Invalid address selection."
                })

            delivery_address = {
                "full_name": saved_address.full_name,
                "phone": saved_address.phone,
                "address_line": saved_address.address_line,
                "city": saved_address.city,
                "state": saved_address.state,
                "pincode": saved_address.pincode,
            }
        else:
            delivery_address = new_address

        try:
            cart = Cart.objects.prefetch_related(
                "items__product__category",
                "items__product__artisan__user"
            ).get(user=user)
        except Cart.DoesNotExist:
            raise serializers.ValidationError({
                "cart": "Your cart is empty."
            })

        cart_items = list(cart.items.all())

        if not cart_items:
            raise serializers.ValidationError({
                "cart": "Your cart is empty."
            })

        subtotal = Decimal("0.00")

        for item in cart_items:
            product = item.product

            is_available = (
                product.is_published
                and not product.is_deleted
                and not product.category.is_deleted
                and product.artisan.verification_status == "APPROVED"
                and product.artisan.user.is_active
                and product.stock > 0
                and item.quantity <= product.stock
            )

            if not is_available:
                raise serializers.ValidationError({
                    "cart": (
                        f"{product.name} is unavailable "
                        "or has insufficient stock."
                    )
                })

            subtotal += item.subtotal

        attrs["cart"] = cart
        attrs["delivery_address"] = delivery_address
        attrs["subtotal"] = subtotal

        return attrs


class BuyNowCheckoutSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    address_id = serializers.IntegerField(required=False)
    address = CheckoutAddressSerializer(required=False)
    checkout_key = serializers.UUIDField()
    payment_method = serializers.ChoiceField(
        choices=Payment.Method.choices
    )
    coupon_code = serializers.CharField(
        required=False,
        allow_blank=True,
        default=""
    )

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user

        address_id = attrs.get("address_id")
        new_address = attrs.get("address")

        if bool(address_id) == bool(new_address):
            raise serializers.ValidationError(
                "Select an existing address or provide a new address."
            )

        if address_id:
            try:
                address_obj = Address.objects.get(
                    id=address_id,
                    user=user
                )
            except Address.DoesNotExist:
                raise serializers.ValidationError({
                    "address_id": "Invalid address selection."
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
            address_obj = None
            delivery_address = new_address

        try:
            product = Product.objects.select_related(
                "category",
                "artisan__user"
            ).get(id=attrs["product_id"])
        except Product.DoesNotExist:
            raise serializers.ValidationError({
                "product_id": "Product not found."
            })

        quantity = attrs["quantity"]

        is_available = (
            product.is_published
            and not product.is_deleted
            and not product.category.is_deleted
            and product.artisan.verification_status == "APPROVED"
            and product.artisan.user.is_active
            and product.stock > 0
            and quantity <= product.stock
        )

        if not is_available:
            raise serializers.ValidationError({
                "product": (
                    "This product is unavailable "
                    "or has insufficient stock."
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

        attrs["product"] = product
        attrs["address_obj"] = address_obj
        attrs["delivery_address"] = delivery_address
        attrs["unit_price"] = unit_price
        attrs["subtotal"] = unit_price * quantity

        return attrs



class CancelOrderSerializer(serializers.Serializer):

    order_item_id = serializers.IntegerField(
        required=True,
        min_value=1
    )

    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000
    )

    def validate_reason(self, value):
        return value.strip()


class ReturnRequestSerializer(serializers.ModelSerializer):

    class Meta:
        model = ReturnRequest
        fields = [
            "id",
            "order",
            "reason",
            "status",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "order",
            "status",
            "created_at",
        ]

    def validate_reason(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Return reason is required."
            )

        return value


class CouponUsageSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source="user.email", read_only=True)
    order_number = serializers.SerializerMethodField()

    class Meta:
        model = CouponUsage
        fields = [
            "id",
            "user",
            "user_name",
            "user_email",
            "order",
            "order_number",
            "discount_amount",
            "created_at",
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_order_number(self, obj):
        return f"CRP-{obj.order_id:05d}"


class CouponAdminSerializer(serializers.ModelSerializer):
    usages = CouponUsageSerializer(many=True, read_only=True)
    actual_used_count = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            "id",
            "code",
            "discount_type",
            "discount_value",
            "min_order_amount",
            "max_discount_amount",
            "start_date",
            "expiry_date",
            "max_total_usage",
            "max_usage_per_customer",
            "total_used_count",
            "actual_used_count",
            "is_active",
            "is_deleted",
            "usages",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "total_used_count",
            "actual_used_count",
            "is_deleted",
            "usages",
            "created_at",
            "updated_at",
        ]

    def get_actual_used_count(self, obj):
        return obj.usages.count()

    def validate_code(self, value):
        code_clean = value.strip().upper()

        if not code_clean:
            raise serializers.ValidationError(
                "Coupon code cannot be empty."
            )

        if len(code_clean) < 3:
            raise serializers.ValidationError(
                "Coupon code must be at least 3 characters long."
            )

        qs = Coupon.objects.filter(
            code__iexact=code_clean,
            is_deleted=False
        )

        if self.instance:
            qs = qs.exclude(id=self.instance.id)

        if qs.exists():
            raise serializers.ValidationError(
                "A coupon with this code already exists."
            )

        return code_clean

    def validate_discount_value(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError(
                "Discount value must be greater than zero."
            )

        return value

    def validate(self, attrs):
        discount_type = attrs.get(
            "discount_type",
            getattr(self.instance, "discount_type", None)
        )
        discount_value = attrs.get(
            "discount_value",
            getattr(self.instance, "discount_value", None)
        )
        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None)
        )
        expiry_date = attrs.get(
            "expiry_date",
            getattr(self.instance, "expiry_date", None)
        )

        if discount_type == Coupon.DiscountType.PERCENTAGE:
            if discount_value and discount_value > Decimal("100.00"):
                raise serializers.ValidationError({
                    "discount_value": (
                        "Percentage discount cannot exceed 100%."
                    )
                })

        if start_date and expiry_date and expiry_date <= start_date:
            raise serializers.ValidationError({
                "expiry_date": (
                    "Expiry date must be after the start date."
                )
            })

        if self.instance and self.instance.orders.filter(
            status__in=[
                Order.Status.CONFIRMED,
                Order.Status.SHIPPED,
                Order.Status.DELIVERED
            ]
        ).exists():

            if (
                "discount_type" in attrs
                and attrs["discount_type"] != self.instance.discount_type
            ):
                raise serializers.ValidationError({
                    "discount_type": (
                        "Cannot modify discount type for a coupon "
                        "that has already been redeemed."
                    )
                })

            if (
                "discount_value" in attrs
                and attrs["discount_value"] != self.instance.discount_value
            ):
                raise serializers.ValidationError({
                    "discount_value": (
                        "Cannot modify discount value for a coupon "
                        "that has already been redeemed."
                    )
                })

        return attrs


class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50, required=True)
    product_id = serializers.IntegerField(required=False)
    quantity = serializers.IntegerField(required=False, min_value=1)

class AvailableCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            "id",
            "code",
            "discount_type",
            "discount_value",
            "min_order_amount",
            "max_discount_amount",
            "start_date",
            "expiry_date",
        ]
