
import secrets
from datetime import timedelta
from urllib.parse import urlencode

from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.db import transaction
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView, PermissionDenied
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination

from rest_framework_simplejwt.tokens import RefreshToken

from .models import Address, User, EmailOTP, ArtisanProfile
from product.models import Category, Product

from .serializers import (
    AddressSerializer,
    AdminArtisanSerializer,
    ArtisanOwnProfileSerializer,
    ArtisanOwnProfileUpdateSerializer,
    UserRegistrationSerializer,
    VerifyOTPSerializer,
    UserLoginSerializer,
    UserProfileUpdateSerializer,
    AdminUserListSerializer,
    AdminLoginSerializer,
    ArtisanLoginSerializer,
    ArtisanRegistrationSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ApprovedArtisanSerializer,
    ArtisanProfileDetailSerializer,
    ChangePasswordSerializer,
)
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token

User = get_user_model()


# ==========================================
# USER REGISTRATION
# ==========================================
from rest_framework.throttling import ScopedRateThrottle
class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save(email_verified=False)

        otp = f"{secrets.randbelow(1000000):06d}"

        EmailOTP.objects.filter(user=user).delete()

        EmailOTP.objects.create(
            user=user,
            otp=otp,
            purpose="registration",
            expires_at=timezone.now() + timedelta(minutes=5),
        )

        send_mail(
            subject="Craftopia Email Verification OTP",
            message=(
                f"Hello {user.username},\n\n"
                f"Your Craftopia verification OTP is: {otp}\n"
                "This OTP expires in 5 minutes."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {
                "message": "Registration successful. OTP sent to your email.",
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


# ==========================================
# REGISTRATION OTP VERIFICATION
# ==========================================

class VerifyOTPView(generics.GenericAPIView):
    serializer_class = VerifyOTPSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        otp_record = serializer.validated_data["otp_record"]

        user.email_verified = True
        user.save(update_fields=["email_verified"])

        otp_record.delete()

        return Response(
            {"message": "Email verified successfully. You can now log in."},
            status=status.HTTP_200_OK,
        )


# ==========================================
# RESEND REGISTRATION OTP
# ==========================================

class ResendOTPView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(
            email__iexact=email
        ).first()

        if user is None:
            return Response(
                {"error": "No account found with this email."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.email_verified:
            return Response(
                {"error": "This email is already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        EmailOTP.objects.filter(
              user=user,
              purpose="registration").delete()
                                    

        otp = f"{secrets.randbelow(1000000):06d}"

        EmailOTP.objects.create(
            user=user,
            otp=otp,
            expires_at=timezone.now() + timedelta(minutes=5),
        )

        send_mail(
            subject="Craftopia Email Verification OTP",
            message=(
                f"Hello {user.username},\n\n"
                f"Your new Craftopia verification OTP is: {otp}\n"
                "This OTP expires in 5 minutes."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {
                "message": "A new OTP has been sent to your email.",
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )


# ==========================================
# CHANGE EMAIL - SEND OTP
# ==========================================

class ChangeEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_email = request.data.get("email")

        if not new_email:
            return Response(
                {"error": "New email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_email = new_email.strip().lower()

        if User.objects.filter(
            email__iexact=new_email
        ).exclude(id=request.user.id).exists():
            return Response(
                {"error": "This email is already registered."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_email == request.user.email.lower():
            return Response(
                {"error": "This is already your current email."},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp = f"{secrets.randbelow(1000000):06d}"

        expires_at = timezone.now() + timedelta(minutes=5)

        user = request.user

        user.pending_email = new_email
        user.save(update_fields=["pending_email"])

        otp_record = EmailOTP.objects.create(
            user=user,
            otp=otp,
            purpose="email_change",
            expires_at=expires_at
        )

        try:
            send_mail(
                subject="Craftopia - Email Change OTP",
                message=(
                    f"Your OTP for changing your Craftopia email is {otp}.\n\n"
                    "This OTP expires in 5 minutes."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[new_email],
                fail_silently=False,
            )

        except Exception:
            user.pending_email = ""
            user.save(update_fields=["pending_email"])

            otp_record.delete()

            return Response(
                {"error": "Unable to send OTP. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                "message": "OTP sent to your new email address.",
                "email": new_email,
            },
            status=status.HTTP_200_OK
        )


# ==========================================
# CHANGE EMAIL - VERIFY OTP
# ==========================================

class VerifyChangeEmailOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        otp = request.data.get("otp")
        user = request.user

        if not otp:
            return Response(
                {"error": "OTP is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.pending_email:
            return Response(
                {"error": "No pending email change request found."},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp_record = EmailOTP.objects.filter(
            user=user,
            otp=otp,
            purpose="email_change"
        ).order_by("-created_at").first()

        if not otp_record:
            return Response(
                {"error": "Invalid OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp_record.expires_at <= timezone.now():
            otp_record.delete()

            return Response(
                {"error": "OTP expired. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(
            email__iexact=user.pending_email
        ).exclude(id=user.id).exists():
            otp_record.delete()

            return Response(
                {"error": "This email is already registered."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.email = user.pending_email
        user.pending_email = ""
        user.email_verified = True

        user.save(
            update_fields=[
                "email",
                "pending_email",
                "email_verified"
            ]
        )

        otp_record.delete()

        return Response(
            {
                "message": "Email address updated successfully.",
                "email": user.email,
            },
            status=status.HTTP_200_OK
        )


# ==========================================
# CUSTOMER LOGIN
# ==========================================

class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = UserLoginSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        if not user.email_verified:
            return Response(
                {
                    "message": (
                        "Email not verified. "
                        "Please verify your email using OTP first."
                    ),
                    "email_verified": False,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Login successful.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


# ==========================================
# USER PROFILE
# ==========================================

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        profile_image_url = None

        if user.profile_image:
            profile_image_url = request.build_absolute_uri(
                user.profile_image.url
            )

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "profile_image": profile_image_url,
            "role": user.role,
        })

    def patch(self, request):
        print("REQUEST DATA:", request.data)
        print("UPLOADED FILES:", request.FILES)

        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        user = request.user

        remove_image = request.data.get("remove_profile_image") == "true"

        if remove_image and "profile_image" not in request.FILES:
            if user.profile_image:
                user.profile_image.delete(save=False)
                user.profile_image = None
                user.save(update_fields=["profile_image"])

        profile_image_url = None

        if user.profile_image:
            profile_image_url = request.build_absolute_uri(
                user.profile_image.url
            )

        return Response({
            "message": "Profile updated successfully.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "profile_image": profile_image_url,
                "role": user.role,
            }
        }, status=status.HTTP_200_OK)


# ==========================================
# ADMIN USER LIST
# ==========================================

class AdminUserPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserListSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminUserPagination
    filter_backends = [filters.SearchFilter]
    search_fields = [
        "username",
        "email",
        "first_name",
        "last_name"
    ]

    def get_queryset(self):
     return User.objects.filter(
        role="CUSTOMER"
    ).order_by("-date_joined")

class AdminArtisanListView(generics.ListAPIView):
    serializer_class = AdminArtisanSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminUserPagination
    filter_backends = [filters.SearchFilter]

    search_fields = [
        "business_name",
        "craft_type",
        "user__first_name",
        "user__last_name",
        "user__email",
    ]

    def get_queryset(self):
        return ArtisanProfile.objects.select_related(
            "user"
        ).order_by("-created_at")
# ==========================================
# ADMIN DASHBOARD SUMMARY
# ==========================================

class AdminDashboardSummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):

        # USER COUNTS
        customers = User.objects.filter(role="CUSTOMER")

        total_users = customers.count()
        active_users = customers.filter(is_active=True).count()
        blocked_users = customers.filter(is_active=False).count()
        unverified_users = customers.filter(
            email_verified=False
        ).count()

        # ARTISAN COUNTS
        artisans = ArtisanProfile.objects.all()

        total_artisans = artisans.count()
        pending_artisans = artisans.filter(
            verification_status="PENDING"
        ).count()
        approved_artisans = artisans.filter(
            verification_status="APPROVED"
        ).count()
        rejected_artisans = artisans.filter(
            verification_status="REJECTED"
        ).count()

        # CATEGORY COUNTS
        categories = Category.objects.filter(is_deleted=False)
        total_categories = categories.count()

        # PRODUCT COUNTS
        products = Product.objects.filter(is_deleted=False)

        total_products = products.count()
        published_products = products.filter(
            is_published=True
        ).count()
        unpublished_products = products.filter(
            is_published=False
        ).count()

        # RECENT USERS
        recent_users = list(
            customers.order_by("-date_joined")
            .values(
                "id",
                "username",
                "first_name",
                "last_name",
                "email",
                "is_active",
                "email_verified",
                "date_joined",
            )[:5]
        )

        # RECENT ARTISANS
        recent_artisans = list(
            artisans.select_related("user")
            .order_by("-created_at")
            .values(
                "id",
                "business_name",
                "craft_type",
                "verification_status",
                "created_at",
                "user__email",
                "user__first_name",
                "user__last_name",
            )[:5]
        )

        # RECENT PRODUCTS
        recent_products = list(
            products.select_related("category", "artisan")
            .order_by("-created_at")
            .values(
                "id",
                "name",
                "price",
                "stock",
                "is_published",
                "created_at",
                "category__name",
                "artisan__business_name",
            )[:5]
        )

        return Response({
            "stats": {
                "total_users": total_users,
                "active_users": active_users,
                "blocked_users": blocked_users,
                "unverified_users": unverified_users,

                "total_artisans": total_artisans,
                "pending_artisans": pending_artisans,
                "approved_artisans": approved_artisans,
                "rejected_artisans": rejected_artisans,

                "total_categories": total_categories,

                "total_products": total_products,
                "published_products": published_products,
                "unpublished_products": unpublished_products,
            },
            "recent_users": recent_users,
            "recent_artisans": recent_artisans,
            "recent_products": recent_products,
        }, status=status.HTTP_200_OK)

# ==========================================
# ADMIN BLOCK / UNBLOCK USER
# ==========================================

class AdminUserStatusUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, id):
        try:
            user = User.objects.get(id=id)

        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.id == request.user.id and request.data.get("is_active") is False:
            return Response(
                {"detail": "You cannot deactivate your own admin account."},
                status=status.HTTP_403_FORBIDDEN,
            )

        is_active = request.data.get("is_active")

        if not isinstance(is_active, bool):
            return Response(
                {"detail": "is_active must be true or false."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = is_active
        user.save(update_fields=["is_active"])

        message = (
            "User account activated successfully."
            if is_active
            else "User account deactivated successfully."
        )

        return Response(
            {
                "message": message,
                "user_id": user.id,
                "is_active": user.is_active,
            },
            status=status.HTTP_200_OK,
        )


# ==========================================
# LOGOUT
# ==========================================

class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(
            {"message": "Logout successful"},
            status=status.HTTP_200_OK
        )


# ==========================================
# CURRENT USER
# ==========================================

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response({
            "id": user.id,
            "name": user.first_name or user.username,
            "email": user.email,
            "role": user.role.lower(),
        }, status=status.HTTP_200_OK)


# ==========================================
# ARTISAN LOGIN
# ==========================================

class ArtisanLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ArtisanLoginSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Artisan login successful.",
                "user": {
                    "id": user.id,
                    "name": user.first_name or user.username,
                    "email": user.email,
                    "role": user.role.lower(),
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


# ==========================================
# ARTISAN REGISTRATION
# ==========================================

class ArtisanRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ArtisanRegistrationSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        otp = f"{secrets.randbelow(1000000):06d}"

        EmailOTP.objects.filter(user=user, purpose="registration").delete()

        EmailOTP.objects.create(
            user=user,
            otp=otp,
            purpose="registration",
            expires_at=timezone.now() + timedelta(minutes=5),
        )

        send_mail(
            subject="Craftopia Email Verification OTP",
            message=(
                f"Hello {user.username},\n\n"
                f"Your Craftopia verification OTP is: {otp}\n"
                "This OTP expires in 5 minutes."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {
                "message": (
                    "Artisan registration successful. "
                    "OTP sent to your email."
                ),
                "email": user.email,
                "artisan_id": user.artisan_profile.id,
                "status": user.artisan_profile.verification_status,
            },
            status=status.HTTP_201_CREATED,
        )


# ==========================================
# ADMIN LOGIN
# ==========================================

class AdminLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AdminLoginSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Admin login successful.",
                "user": {
                    "id": user.id,
                    "name": user.first_name or user.username,
                    "email": user.email,
                    "role": user.role.lower(),
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


# ==========================================
# FORGOT PASSWORD
# ==========================================

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "forgot_password"

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        user = User.objects.get(email__iexact=email)

        if not user.email_verified:
            return Response(
                {
                    "message": "Please verify your email before resetting your password."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        uid = urlsafe_base64_encode(force_bytes(user.pk))

        token = default_token_generator.make_token(user)

        reset_params = urlencode({
            "uid": uid,
            "token": token,
        })

        reset_link = (
            f"http://localhost:5173/reset-password/?{reset_params}"
        )

        print("GENERATED RESET LINK:", reset_link)
        
        send_mail(
            subject="Craftopia Password Reset",
            message=(
                "Use this link to reset your Craftopia password:\n\n"
                f"{reset_link}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {"message": "Password reset link sent successfully."},
            status=status.HTTP_200_OK,
        )


# ==========================================
# RESET PASSWORD
# ==========================================

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "reset_password"

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)

        print("RESET REQUEST DATA:", {
            "uid_present": bool(request.data.get("uid")),
            "token_present": bool(request.data.get("token")),
            "password_present": bool(request.data.get("new_password")),
            "uid": request.data.get("uid"),
            "token": request.data.get("token"),
            "new_password": request.data.get("new_password"),
        })

        if not serializer.is_valid():
            print("RESET SERIALIZER ERRORS:", serializer.errors)

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            uid_value = request.data.get("uid", "").strip()

            print("RESET UID RECEIVED:", repr(uid_value))

            uid = urlsafe_base64_decode(uid_value).decode()

            user = User.objects.get(pk=uid)

        except (
            TypeError,
            ValueError,
            OverflowError,
            User.DoesNotExist
        ) as exc:
            print("RESET UID ERROR:", repr(exc))

            return Response(
                {"error": "Invalid or expired reset token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        print("RESET UID:", uid)

        print(
            "RESET TOKEN VALID:",
            default_token_generator.check_token(user, token),
        )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": "Invalid or expired reset token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.email_verified:
            return Response(
                {"error": "Email is not verified."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Password reset successfully."},
            status=status.HTTP_200_OK,
        )
# ==========================================
# HOMEPAGE STATS
# ==========================================

class HomeStatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):

        verified_artisans = ArtisanProfile.objects.filter(
            verification_status="APPROVED",
            user__is_active=True
        ).count()

        handmade_products = Product.objects.filter(
            is_published=True,
            is_deleted=False,
            category__is_deleted=False,
            artisan__verification_status="APPROVED",
            artisan__user__is_active=True
        ).count()

        craft_categories = Category.objects.filter(
            is_deleted=False
        ).count()

        return Response({
            "verified_artisans": verified_artisans,
            "handmade_products": handmade_products,
            "craft_categories": craft_categories
        }, status=status.HTTP_200_OK)

# ==========================================
# APPROVED ARTISAN LIST
# ==========================================

class ApprovedArtisanListView(generics.ListAPIView):
    serializer_class = ApprovedArtisanSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return ArtisanProfile.objects.filter(
            verification_status=ArtisanProfile.VerificationStatus.APPROVED
        ).select_related("user")

# ==========================================
# ADMIN ARTISAN STATUS UPDATE
# ==========================================

class AdminArtisanStatusUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, id):
        try:
            artisan = ArtisanProfile.objects.get(id=id)

        except ArtisanProfile.DoesNotExist:
            return Response(
                {"detail": "Artisan not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        verification_status = request.data.get(
            "verification_status"
        )

        allowed_statuses = [
            ArtisanProfile.VerificationStatus.APPROVED,
            ArtisanProfile.VerificationStatus.REJECTED,
        ]

        if verification_status not in allowed_statuses:
            return Response(
                {
                    "detail": "Invalid status. Use APPROVED or REJECTED."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        artisan.verification_status = verification_status

        artisan.save(
            update_fields=["verification_status", "updated_at"]
        )

        return Response(
            {
                "message": f"Artisan {verification_status.lower()} successfully.",
                "artisan_id": artisan.id,
                "business_name": artisan.business_name,
                "verification_status": artisan.verification_status,
            },
            status=status.HTTP_200_OK,
        )


# ==========================================
# ARTISAN PROFILE DETAIL
# ==========================================

class ArtisanProfileDetailView(generics.RetrieveAPIView):
    serializer_class = ArtisanProfileDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "id"

    def get_queryset(self):
        return ArtisanProfile.objects.filter(
            verification_status=ArtisanProfile.VerificationStatus.APPROVED
        ).select_related("user")

    
from django.shortcuts import get_object_or_404   


class ArtisanOwnProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        user = self.request.user

        if user.role != "ARTISAN":
            raise PermissionDenied(
                "Only artisans can access this resource"
            )

        return get_object_or_404(
            ArtisanProfile.objects.select_related("user"),
            user=user
        )

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return ArtisanOwnProfileUpdateSerializer

        return ArtisanOwnProfileSerializer

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        profile_image_url = None

        if instance.profile_image:
            profile_image_url = request.build_absolute_uri(
                instance.profile_image.url
            )

        return Response({
            "message": "Profile updated successfully",
            "name": instance.user.first_name,
            "business_name": instance.business_name,
            "email": instance.user.email,
            "craft_type": instance.craft_type,
            "phone": instance.phone,
            "location": instance.address,
            "bio": instance.bio,
            "profile_image": profile_image_url,
            "status": instance.verification_status,
        })

# ==========================================
# CHANGE PASSWORD
# ==========================================

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)

        user = request.user

        user.set_password(
            serializer.validated_data["new_password"]
        )

        user.save()

        return Response(
            {"message": "Password changed successfully."},
            status=status.HTTP_200_OK
        )
    
#Address Views

class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(
            user=self.request.user
        ).order_by("-is_default", "-created_at")

    @transaction.atomic
    def perform_create(self, serializer):
        if serializer.validated_data.get("is_default", False):
            Address.objects.filter(
                user=self.request.user,
                is_default=True
            ).update(is_default=False)

        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(
            user=self.request.user
        )

    @transaction.atomic
    def perform_update(self, serializer):
        is_default = serializer.validated_data.get(
            "is_default",
            serializer.instance.is_default
        )

        if is_default:
            Address.objects.filter(
                user=self.request.user,
                is_default=True
            ).exclude(
                id=serializer.instance.id
            ).update(is_default=False)

        serializer.save()


# ==========================================
# GOOGLE CUSTOMER LOGIN
# ==========================================

class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        credential = request.data.get("credential")

        if not credential:
            return Response(
                {"error": "Google credential is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        client_id = settings.GOOGLE_CLIENT_ID

        if not client_id:
            return Response(
                {"error": "Google authentication is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            google_user = id_token.verify_oauth2_token(
                credential,
                GoogleRequest(),
                audience=client_id
            )

        except Exception:
            return Response(
                {"error": "Invalid Google authentication. Please try again."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if google_user.get("email_verified") is not True:
            return Response(
                {"error": "Google email is not verified."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        email = google_user.get("email", "").strip().lower()
        google_id = google_user.get("sub")

        if not email or not google_id:
            return Response(
                {"error": "Google account information is incomplete."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.filter(
                email__iexact=email
            ).first()

            if user:
                if user.role != User.Role.CUSTOMER:
                    return Response(
                        {
                            "error": "Please use the correct login for your account type."
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )

                if not user.is_active:
                    return Response(
                        {"error": "This account is inactive."},
                        status=status.HTTP_403_FORBIDDEN
                    )

                # Google has verified ownership of this email.
                if not user.email_verified:
                    user.email_verified = True
                    user.save(update_fields=["email_verified"])

            else:
                user = User.objects.create_user(
                    username=f"google_{google_id}",
                    email=email,
                    first_name=google_user.get("given_name", ""),
                    last_name=google_user.get("family_name", ""),
                    role=User.Role.CUSTOMER,
                    email_verified=True,
                )

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Google login successful.",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": user.role,
                    },
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=status.HTTP_200_OK
            )

        except Exception:
            return Response(
                {"error": "Unable to complete Google login."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

