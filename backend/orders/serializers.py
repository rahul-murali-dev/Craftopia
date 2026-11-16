
from rest_framework import serializers
from decimal import Decimal

from product.models import Cart, Product
from users.models import Address

from .models import (
    Order,
    OrderItem,
    Payment,
    ReturnRequest,
    ArtisanOrderResponse,
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


class ArtisanOrderResponseSerializer(serializers.ModelSerializer):
    artisan_id = serializers.IntegerField(
        source="artisan.id",
        read_only=True
    )
    artisan_name = serializers.SerializerMethodField()

    class Meta:
        model = ArtisanOrderResponse
        fields = [
            "id",
            "artisan_id",
            "artisan_name",
            "status",
            "rejection_reason",
            "response_note",
            "responded_at",
        ]
        read_only_fields = fields

    def get_artisan_name(self, obj):
        return (
            obj.artisan.get_full_name()
            or obj.artisan.username
        )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    return_request = serializers.SerializerMethodField()

    artisan_responses = ArtisanOrderResponseSerializer(
        many=True,
        read_only=True
    )

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
            "shipping_charge",
            "tax",
            "total_amount",
            "status",
            "cancellation_reason",
            "items",
            "return_request",
            "artisan_responses",
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
