from django.contrib import admin
from .models import Category, Product, ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_deleted", "created_at")
    search_fields = ("name",)
    ordering = ("-created_at",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "artisan",
        "category",
        "price",
        "stock",
        "is_published",
        "is_deleted",
    )
    search_fields = ("name", "artisan__business_name")
    list_filter = ("category", "is_published", "is_deleted")
    ordering = ("-created_at",)


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "created_at")