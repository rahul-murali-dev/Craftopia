from django.urls import path
from .views import (AddToCartView, 
ArtisanCategoryListView, 
CartDetailView, 
CartValidationView,
 CategoryListCreateView,
   CategoryDetailView,
     ArtisanProductListCreateView,
       ArtisanProductDetailView, 
       ArtisanProductImageDeleteView, 
       CustomerCategoryListView, 
       CustomerProductListView, 
       CustomerProductDetailView, 
       UpdateCartItemView, WishlistItemDetailView, WishlistView)

urlpatterns = [
    path("categories/", CategoryListCreateView.as_view(), name="category-list-create"),

    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),

    path("artisan/products/", ArtisanProductListCreateView.as_view(), name="artisan-product-list-create"),

    path("artisan/products/<int:pk>/", ArtisanProductDetailView.as_view(), name="artisan-product-detail"),

    path("artisan/products/<int:product_pk>/images/<int:pk>/", ArtisanProductImageDeleteView.as_view(), 
            name="artisan-product-image-delete"),

    path("products/", CustomerProductListView.as_view(), name="customer-product-list"),
    
    path("products/<int:pk>/", CustomerProductDetailView.as_view(), name="customer-product-detail"),

    path("artisan/categories/", ArtisanCategoryListView.as_view(), name="artisan-category-list"),

    path("public/categories/", CustomerCategoryListView.as_view(), name="customer-category-list"),

    path("cart/add/", AddToCartView.as_view(), name="add-to-cart"),

    path("cart/", CartDetailView.as_view(), name="cart-detail"),

    
    path("cart/items/<int:pk>/", UpdateCartItemView.as_view(), name="update-cart-item"),
    

    

    path("wishlist/", WishlistView.as_view(), name="wishlist"),
    
    path( "wishlist/<int:pk>/", WishlistItemDetailView.as_view(), name="wishlist-item-detail"),

    path( "cart/validate/",CartValidationView.as_view(), name="cart-validation"),
    
    
   


]