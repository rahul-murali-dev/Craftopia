from rest_framework import generics, filters, permissions, status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from .models import Wishlist
from .serializers import AdminProductSerializer, WishlistSerializer
from .models import (
    Category,
    Product,
    ProductImage,
    Cart,
    CartItem,
)

from .serializers import (
    CategorySerializer,
    CustomerProductListSerializer,
    ProductSerializer,
    ProductDetailSerializer,
    CartSerializer,
)
# Category Pagination
class CategoryPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


# Category List and Create
class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]
    pagination_class = CategoryPagination

    queryset = Category.objects.filter(
        is_deleted=False
    ).order_by("-created_at")

    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]


# Category Detail, Update and Soft Delete
class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]

    queryset = Category.objects.filter(is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=["is_deleted"])


# Approved Artisan Permission
class IsApprovedArtisan(permissions.BasePermission):

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.role != "ARTISAN":
            return False

        try:
            artisan = user.artisan_profile
        except Exception:
            return False

        return artisan.verification_status == "APPROVED"


# Artisan Product List and Create
class ArtisanProductListCreateView(generics.ListCreateAPIView):

    serializer_class = ProductSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsApprovedArtisan
    ]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Product.objects.filter(
            artisan=self.request.user.artisan_profile,
            is_deleted=False
        ).order_by("-created_at")

    def perform_create(self, serializer):
        product = serializer.save(
            artisan=self.request.user.artisan_profile
        )

        images = self.request.FILES.getlist("images")

        for image in images:
            ProductImage.objects.create(
                product=product,
                image=image
            )


# Artisan Product Detail, Update and Soft Delete
class ArtisanProductDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = ProductSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsApprovedArtisan
    ]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Product.objects.filter(
            artisan=self.request.user.artisan_profile,
            is_deleted=False
        )

    def perform_update(self, serializer):
        product = serializer.save()

        # Add new images without deleting existing images
        images = self.request.FILES.getlist("images")

        for image in images:
            ProductImage.objects.create(
                product=product,
                image=image
            )

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=["is_deleted"])


# Artisan Delete Individual Product Image
class ArtisanProductImageDeleteView(generics.DestroyAPIView):

    permission_classes = [
        permissions.IsAuthenticated,
        IsApprovedArtisan
    ]

    def get_queryset(self):
        return ProductImage.objects.filter(
            product__id=self.kwargs["product_pk"],
            product__artisan=self.request.user.artisan_profile,
            product__is_deleted=False
        )


    
class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 50


class CustomerProductListView(generics.ListAPIView):
    serializer_class = CustomerProductListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = ProductPagination

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "description",
        "category__name",
    ]

    ordering_fields = [
        "name",
        "price",
        "created_at",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = Product.objects.filter(
            is_published=True,
            is_deleted=False,
            category__is_deleted=False,
            artisan__verification_status="APPROVED",
            artisan__user__is_active=True,
        ).select_related(
            "artisan",
            "category",
        ).prefetch_related(
            "images",
        )

        # Category Filter
        category_id = self.request.query_params.get("category")

        if category_id:
            queryset = queryset.filter(
                category_id=category_id
            )

        # Minimum Price Filter
        min_price = self.request.query_params.get("min_price")

        if min_price:
            queryset = queryset.filter(
                price__gte=min_price
            )

        # Maximum Price Filter
        max_price = self.request.query_params.get("max_price")

        if max_price:
            queryset = queryset.filter(
                price__lte=max_price
            )
        # Artisan Filter
        artisan_id = self.request.query_params.get("artisan_id")

        if artisan_id:
         queryset = queryset.filter(
         artisan_id=artisan_id
    )    

        return queryset

    

class CustomerProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Product.objects.filter(
            is_published=True,
            is_deleted=False,
            category__is_deleted=False,
            artisan__verification_status="APPROVED",
            artisan__user__is_active=True,
        ).select_related(
            "artisan",
            "category",
        ).prefetch_related(
            "images",
        )  

# Artisan Category List
class ArtisanCategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedArtisan]
    queryset = Category.objects.filter(is_deleted=False).order_by("name")    


class CustomerCategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Category.objects.filter(
            is_deleted=False
        ).order_by("name")

# Add Product to Cart
class AddToCartView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):

        # Only Customer can add products to cart
        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can add products to cart."},
                status=status.HTTP_403_FORBIDDEN
            )

        product_id = request.data.get("product_id")
        quantity = request.data.get("quantity", 1)

        # Validate product ID
        if not product_id:
            return Response(
                {"error": "Product ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate quantity
        try:
            quantity = int(quantity)

            if quantity < 1:
                raise ValueError

        except (ValueError, TypeError):
            return Response(
                {"error": "Quantity must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get available product
        product = Product.objects.filter(
            id=product_id,
            is_published=True,
            is_deleted=False,
            category__is_deleted=False,
            artisan__verification_status="APPROVED",
            artisan__user__is_active=True,
        ).first()

        if not product:
            return Response(
                {"error": "Product is unavailable."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check stock
        if product.stock < 1:
            return Response(
                {"error": "Product is out of stock."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity > product.stock:
            return Response(
                {
                    "error": f"Only {product.stock} items are available."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():

            cart, created = Cart.objects.get_or_create(
                user=request.user
            )

            cart_item = CartItem.objects.filter(
                cart=cart,
                product=product
            ).first()

            if cart_item:

                new_quantity = cart_item.quantity + quantity

                if new_quantity > product.stock:
                    return Response(
                        {
                            "error": (
                                f"Only {product.stock} items are available. "
                                f"Already {cart_item.quantity} in your cart."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                cart_item.quantity = new_quantity
                cart_item.save()

            else:

                cart_item = CartItem.objects.create(
                    cart=cart,
                    product=product,
                    quantity=quantity
                )

            # Remove product from customer's wishlist
            Wishlist.objects.filter(
                user=request.user,
                product=product
            ).delete()

        return Response(
            {
                "message": "Product added to cart successfully.",
                "cart": CartSerializer(cart).data
            },
            status=status.HTTP_201_CREATED
        )
# Get Customer Cart
class CartDetailView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):

        # Only Customer can view cart
        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can view cart."},
                status=status.HTTP_403_FORBIDDEN
            )

        cart, created = Cart.objects.get_or_create(
            user=request.user
        )

        serializer = CartSerializer(cart)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

# Update Cart Item Quantity
class UpdateCartItemView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    # Update Cart Item Quantity
    def patch(self, request, pk):

        # Only Customer can update cart
        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can update cart."},
                status=status.HTTP_403_FORBIDDEN
            )

        quantity = request.data.get("quantity")

        # Validate quantity
        try:
            quantity = int(quantity)

            if quantity < 1:
                raise ValueError

        except (ValueError, TypeError):
            return Response(
                {"error": "Quantity must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get customer's cart item
        cart_item = CartItem.objects.filter(
            id=pk,
            cart__user=request.user
        ).select_related("product").first()

        if not cart_item:
            return Response(
                {"error": "Cart item not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        product = cart_item.product

        # Check product availability
        if (
            not product.is_published
            or product.is_deleted
            or product.category.is_deleted
            or product.artisan.verification_status != "APPROVED"
            or not product.artisan.user.is_active
        ):
            return Response(
                {"error": "Product is unavailable."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check stock
        if product.stock < 1:
            return Response(
                {"error": "Product is out of stock."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity > product.stock:
            return Response(
                {
                    "error": f"Only {product.stock} items are available."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update quantity
        cart_item.quantity = quantity
        cart_item.save()

        return Response(
            {
                "message": "Cart quantity updated successfully.",
                "cart": CartSerializer(cart_item.cart).data
            },
            status=status.HTTP_200_OK
        )

    # Remove Cart Item
    def delete(self, request, pk):

        # Only Customer can remove cart items
        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can remove cart items."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get customer's cart item
        cart_item = CartItem.objects.filter(
            id=pk,
            cart__user=request.user
        ).first()

        if not cart_item:
            return Response(
                {"error": "Cart item not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        cart = cart_item.cart

        # Delete cart item
        cart_item.delete()

        return Response(
            {
                "message": "Product removed from cart successfully.",
                "cart": CartSerializer(cart).data
            },
            status=status.HTTP_200_OK
        )

# Remove Cart Item
class RemoveCartItemView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):

        # Only Customer can remove cart items
        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can remove cart items."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get customer's cart item
        cart_item = CartItem.objects.filter(
            id=pk,
            cart__user=request.user
        ).first()

        if not cart_item:
            return Response(
                {"error": "Cart item not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        cart = cart_item.cart

        # Remove item
        cart_item.delete()

        return Response(
            {
                "message": "Product removed from cart successfully.",
                "cart": CartSerializer(cart).data
            },
            status=status.HTTP_200_OK
        )    

class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "CUSTOMER":
            return Response(
                {"message": "Only customers can access wishlist."},
                status=status.HTTP_403_FORBIDDEN
            )

        wishlist = Wishlist.objects.filter(
            user=request.user
        ).select_related(
            "product",
            "product__category",
            "product__artisan"
        ).prefetch_related("product__images")

        serializer = WishlistSerializer(wishlist, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.role != "CUSTOMER":
            return Response(
                {"message": "Only customers can add wishlist items."},
                status=status.HTTP_403_FORBIDDEN
            )

        product_id = request.data.get("product_id")

        if not product_id:
            return Response(
                {"message": "Product ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        product = Product.objects.filter(
            id=product_id,
            is_published=True,
            is_deleted=False,
            category__is_deleted=False,
            artisan__verification_status="APPROVED",
            artisan__user__is_active=True
        ).first()

        if not product or product.stock <= 0:
            return Response(
                {"message": "This product is unavailable."},
                status=status.HTTP_404_NOT_FOUND
            )

        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user,
            product=product
        )

        serializer = WishlistSerializer(wishlist_item)

        return Response(
            {
                "message": (
                    "Product added to wishlist."
                    if created
                    else "Product is already in wishlist."
                ),
                "wishlist_item": serializer.data
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class WishlistItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if request.user.role != "CUSTOMER":
            return Response(
                {"message": "Only customers can remove wishlist items."},
                status=status.HTTP_403_FORBIDDEN
            )

        wishlist_item = Wishlist.objects.filter(
            id=pk,
            user=request.user
        ).first()

        if not wishlist_item:
            return Response(
                {"message": "Wishlist item not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        wishlist_item.delete()

        return Response(
            {"message": "Product removed from wishlist."},
            status=status.HTTP_200_OK
        )    

class CartValidationView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):

        # Only Customer can validate checkout
        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can proceed to checkout."},
                status=status.HTTP_403_FORBIDDEN
            )

        with transaction.atomic():

            cart, created = Cart.objects.get_or_create(
                user=request.user
            )

            cart_items = CartItem.objects.filter(
                cart=cart
            ).select_related(
                "product",
                "product__category",
                "product__artisan",
                "product__artisan__user"
            ).select_for_update()

            if not cart_items.exists():
                return Response(
                    {"error": "Your cart is empty."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            errors = []
            cart_total = 0
            total_items = 0

            for item in cart_items:

                product = item.product

                # Check product availability
                if (
                    not product.is_published
                    or product.is_deleted
                    or product.category.is_deleted
                    or product.artisan.verification_status != "APPROVED"
                    or not product.artisan.user.is_active
                ):
                    errors.append({
                        "product_id": product.id,
                        "product_name": product.name,
                        "error": "Product is unavailable."
                    })
                    continue

                # Check stock
                if product.stock < 1:
                    errors.append({
                        "product_id": product.id,
                        "product_name": product.name,
                        "error": "Product is out of stock."
                    })
                    continue

                if item.quantity > product.stock:
                    errors.append({
                        "product_id": product.id,
                        "product_name": product.name,
                        "error": (
                            f"Only {product.stock} items are available."
                        )
                    })
                    continue

                # Calculate latest price from database
                unit_price = product.price

                if (
                    product.discount_price is not None
                    and product.discount_price < product.price
                ):
                    unit_price = product.discount_price

                subtotal = unit_price * item.quantity

                cart_total += subtotal
                total_items += item.quantity

            if errors:
                return Response(
                    {
                        "valid": False,
                        "errors": errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {
                    "valid": True,
                    "message": "Cart validated successfully.",
                    "total_items": total_items,
                    "cart_total": cart_total
                },
                status=status.HTTP_200_OK
            )    


# Admin Product List and Create
class AdminProductListCreateView(generics.ListCreateAPIView):

    serializer_class = AdminProductSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = ProductPagination

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "description",
        "category__name",
        "artisan__business_name",
        "artisan__user__email",
    ]

    ordering_fields = [
        "name",
        "price",
        "created_at",
        "stock",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        return Product.objects.filter(
            is_deleted=False
        ).select_related(
            "artisan",
            "artisan__user",
            "category",
        ).prefetch_related(
            "images",
        ).order_by("-created_at")

    def perform_create(self, serializer):
        product = serializer.save()

        images = self.request.FILES.getlist("images")

        for image in images:
            ProductImage.objects.create(
                product=product,
                image=image
            )

# Admin Product Detail, Update and Soft Delete
class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = AdminProductSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Product.objects.filter(
            is_deleted=False
        ).select_related(
            "artisan",
            "artisan__user",
            "category",
        ).prefetch_related(
            "images",
        )

    def perform_update(self, serializer):
        product = serializer.save()

        # Add new images without deleting existing images
        images = self.request.FILES.getlist("images")

        for image in images:
            ProductImage.objects.create(
                product=product,
                image=image
            )

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=["is_deleted"])


# Admin Delete Individual Product Image
class AdminProductImageDeleteView(generics.DestroyAPIView):

    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return ProductImage.objects.filter(
            product__id=self.kwargs["product_pk"],
            product__is_deleted=False
        )
