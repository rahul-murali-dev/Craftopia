
from django.urls import path
from .views import (
    AddressDetailView,
    AddressListCreateView,
    AdminArtisanListView,
    AdminArtisanStatusUpdateView,
    AdminUserListView,
    ArtisanOwnProfileView,
    ChangeEmailView,
    ChangePasswordView,
    ResendOTPView,
    UserRegistrationView,
    UserLoginView,
    UserProfileView,
    UserLogoutView,
    CurrentUserView,
    ArtisanLoginView,
    ArtisanRegistrationView,
    AdminLoginView,
    ForgotPasswordView,
    ResetPasswordView,
    ApprovedArtisanListView,
    ArtisanProfileDetailView,
    AdminUserStatusUpdateView,
    VerifyChangeEmailOTPView,
    VerifyOTPView,
)

urlpatterns = [
    path("register/", UserRegistrationView.as_view(), name="user-register"),
    path("login/", UserLoginView.as_view(), name="user-login"),
    path("profile/", UserProfileView.as_view(), name="user-profile"),
    path("logout/", UserLogoutView.as_view(), name="user-logout"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("artisan/login/", ArtisanLoginView.as_view(), name="artisan-login"),
    path("artisans/register/", ArtisanRegistrationView.as_view(), name="artisan-register"),
    path("admin/login/", AdminLoginView.as_view(), name="admin-login"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("api/artisans/", ApprovedArtisanListView.as_view(),  name="approved-artisans"),
    path("artisans/<int:id>/",ArtisanProfileDetailView.as_view(),name="artisan-profile-detail"),
    path("admin/users/<int:id>/",AdminUserStatusUpdateView.as_view(), name="admin-user-status-update",),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("resend-otp/", ResendOTPView.as_view(), name="resend-otp"),
    path("change-password/",ChangePasswordView.as_view(), name="change-password"),
    path("change-email/",ChangeEmailView.as_view(), name="change-email"),
    path("verify-change-email-otp/", VerifyChangeEmailOTPView.as_view(),name="verify-change-email-otp"),    
    path("addresses/", AddressListCreateView.as_view(), name="address-list-create"),
    path("addresses/<int:pk>/",AddressDetailView.as_view(),name="address-detail"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list", ),
    path("admin/artisans/", AdminArtisanListView.as_view(), name="admin-artisan-list", ),
    path("admin/artisans/<int:id>/status/", AdminArtisanStatusUpdateView.as_view(), name="admin-artisan-status-update", ),
    path("artisan/profile/",ArtisanOwnProfileView.as_view(),name="artisan-own-profile",),
        
    
    

    
    
   
    

    
    
]

