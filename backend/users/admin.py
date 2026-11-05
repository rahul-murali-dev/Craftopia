

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User,ArtisanProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Craftopia Role", {"fields": ("role",)}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Craftopia Role", {"fields": ("role",)}),
    )

    list_display = ("id", "username", "email", "role", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("username", "email")
    ordering = ("-date_joined",)
    list_per_page = 10
    actions = ["block_users", "unblock_users"]

    @admin.action(description="Block selected users")
    def block_users(self, request, queryset):
        queryset.filter(is_superuser=False).update(is_active=False)

    @admin.action(description="Unblock selected users")
    def unblock_users(self, request, queryset):
        queryset.filter(is_superuser=False).update(is_active=True)
@admin.register(ArtisanProfile)
class ArtisanProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "business_name", "user", "verification_status")
    list_filter = ("verification_status",)
    search_fields = ("business_name", "user__username", "user__email")