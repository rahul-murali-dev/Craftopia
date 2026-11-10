from rest_framework import serializers
from .models import Category, Product, ProductImage, Wishlist
from users.models import ArtisanProfile
from .models import Cart, CartItem

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "is_deleted",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "is_deleted",
            "created_at",
            "updated_at",
        ]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = [
            "id",
            "image",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


class ArtisanProductDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtisanProfile
        fields = [
            "id",
            "business_name",
            "craft_type",
            "phone",
            "address",
            "bio",
            "profile_image",
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    artisan = ArtisanProductDetailSerializer(read_only=True)
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "artisan",
            "category",
            "name",
            "description",
            "price",
            "discount_price",
            "stock",
            "is_published",
            "images",
            "created_at",
            "updated_at",
        ]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    artisan = serializers.PrimaryKeyRelatedField(read_only=True)

    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_deleted=False)
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "artisan",
            "category",
            "name",
            "description",
            "price",
            "discount_price",
            "stock",
            "is_published",
            "is_deleted",
            "images",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "artisan",
            "is_deleted",
            "images",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        price = attrs.get(
            "price",
            self.instance.price if self.instance else None
        )

        discount_price = attrs.get(
            "discount_price",
            self.instance.discount_price if self.instance else None
        )

        if discount_price is not None and price is not None:
            if discount_price >= price:
                raise serializers.ValidationError({
                    "discount_price": "Discount price must be less than regular price."
                })

        return attrs


class CustomerProductListSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    artisan = ArtisanProductDetailSerializer(read_only=True)
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "artisan",
            "category",
            "name",
            "description",
            "price",
            "discount_price",
            "stock",
            "images",
            "created_at",
        ]
class CartItemSerializer(serializers.ModelSerializer):
    product = CustomerProductListSerializer(read_only=True)

    unit_price = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "quantity",
            "unit_price",
            "subtotal",
            "is_available",
        ]

    def get_unit_price(self, obj):
        product = obj.product

        if (
            product.discount_price is not None
            and product.discount_price < product.price
        ):
            return product.discount_price

        return product.price

    def get_subtotal(self, obj):
        return obj.subtotal

    def get_is_available(self, obj):
        product = obj.product

        return (
            product.is_published
            and not product.is_deleted
            and not product.category.is_deleted
            and product.artisan.verification_status == "APPROVED"
            and product.artisan.user.is_active
            and product.stock > 0
            and obj.quantity <= product.stock
        )
class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    total_items = serializers.SerializerMethodField()
    cart_total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "items",
            "total_items",
            "cart_total",
            "created_at",
            "updated_at",
        ]

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_cart_total(self, obj):
        return sum(
            (item.subtotal for item in obj.items.all()),
            start=0
        )    

class WishlistSerializer(serializers.ModelSerializer):
    product = CustomerProductListSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ["id", "product", "created_at"]    