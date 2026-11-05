
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Address, ArtisanProfile
from .models import User, EmailOTP

User = get_user_model()



import re
from rest_framework import serializers

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
        ]

    def validate_first_name(self, value):
        value = value.strip()

        if len(value) < 2:
            raise serializers.ValidationError(
                "First name must contain at least 2 characters."
            )

        if not re.fullmatch(r"[^\W\d_]+(?: [^\W\d_]+)*", value, re.UNICODE):
            raise serializers.ValidationError(
                "First name can contain only letters and spaces."
            )

        return value

    def validate_last_name(self, value):
        value = value.strip()

        if value and not re.fullmatch(
            r"[^\W\d_]+(?: [^\W\d_]+)*", value, re.UNICODE
        ):
            raise serializers.ValidationError(
                "Last name can contain only letters and spaces."
            )

        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        email = attrs["email"]
        otp = attrs["otp"]

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                "email": "No account found with this email."
            })

        if user.email_verified:
            raise serializers.ValidationError({
                "email": "This email is already verified."
            })

        otp_record = EmailOTP.objects.filter(
             user=user,
             otp=otp,
            purpose="registration"
            ).order_by("-created_at").first()
        if otp_record is None:
            raise serializers.ValidationError({
                "otp": "Invalid OTP."
            })

        from django.utils import timezone

        if timezone.now() >= otp_record.expires_at:
            otp_record.delete()
            raise serializers.ValidationError({
                "otp": "OTP has expired. Please request a new OTP."
            })

        attrs["user"] = user
        attrs["otp_record"] = otp_record

        return attrs

from django.contrib.auth import authenticate
from rest_framework import serializers


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        from django.contrib.auth import get_user_model
        from rest_framework.exceptions import AuthenticationFailed

        User = get_user_model()

        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise AuthenticationFailed(
                "Invalid email or password."
            )

        user = authenticate(
            request=self.context.get("request"),
            username=user_obj.get_username(),
            password=password,
        )

        if not user or not user.is_active:
            raise AuthenticationFailed(
                "Invalid email or password."
            )

        # Customer login must reject Artisan and Admin accounts.
        if user.role != User.Role.CUSTOMER:
            raise AuthenticationFailed(
                "Please use the correct login for your account type."
            )

        attrs["user"] = user
        return attrs


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "phone",
            "profile_image",
        ]
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exclude(
            id=self.instance.id
        ).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return value  


class AdminUserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "date_joined",
        ]
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied

class ArtisanLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        email = attrs["email"]
        password = attrs["password"]

        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise AuthenticationFailed("Invalid email or password.")

        user = authenticate(
            request=self.context.get("request"),
            username=user_obj.username,
            password=password,
        )

        if not user or not user.is_active:
            raise AuthenticationFailed("Invalid email or password.")

        if user.role != User.Role.ARTISAN:
            raise PermissionDenied("Artisan permissions required.")

        try:
            profile = user.artisan_profile
        except User.artisan_profile.RelatedObjectDoesNotExist:
            raise PermissionDenied("Artisan profile not found.")

        if profile.verification_status != "APPROVED":
            raise PermissionDenied("Artisan account is not approved.")

        attrs["user"] = user
        return attrs

class ArtisanRegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )
    craft_type = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)

    def validate_name(self, value):
        value = value.strip()

        name_pattern = r"[^\W\d_]+(?:\s+[^\W\d_]+)*"

        if len(value) < 2:
            raise serializers.ValidationError(
                "Name must contain at least 2 characters."
            )

        if not re.fullmatch(name_pattern, value, re.UNICODE):
            raise serializers.ValidationError(
                "Name can contain only letters and spaces."
            )

        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def create(self, validated_data):
        name = validated_data["name"]
        email = validated_data["email"]
        password = validated_data["password"]
        craft_type = validated_data["craft_type"]
        phone = validated_data["phone"]

        user = User(
            username=email,
            email=email,
            first_name=name,
            role=User.Role.ARTISAN,
        )
        user.set_password(password)
        user.save()

        ArtisanProfile.objects.create(
            user=user,
            business_name=name,
            craft_type=craft_type,
            phone=phone,
            address="",
            verification_status="PENDING",
        )

        return user

class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        email = attrs["email"]
        password = attrs["password"]

        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        user = authenticate(
            request=self.context.get("request"),
            username=user_obj.username,
            password=password,
        )

        if not user or not user.is_active:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if user.role != User.Role.ADMIN:
            raise serializers.ValidationError(
                "Admin permissions required."
            )

        attrs["user"] = user
        return attrs    

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "No account found with this email address."
            )
        return value   
    
class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )

    def validate_new_password(self, value):
        from django.contrib.auth.password_validation import validate_password

        validate_password(value)
        return value
class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        user = self.context["request"].user

        # Check current password
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({
                "current_password": "Current password is incorrect."
            })

        # Check new password confirmation
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "New passwords do not match."
            })

        # Prevent using the same password
        if attrs["current_password"] == attrs["new_password"]:
            raise serializers.ValidationError({
                "new_password": "New password must be different from current password."
            })

        from django.contrib.auth.password_validation import validate_password

        validate_password(attrs["new_password"], user)

        return attrs
    
class ApprovedArtisanSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.first_name", read_only=True)

    class Meta:
        model = ArtisanProfile
        fields = [
            "id",
            "name",
            "business_name",
            "craft_type",
            "phone",
            "address",
        ]

class AdminArtisanSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(
        source="user.email",
        read_only=True
    )

    class Meta:
        model = ArtisanProfile
        fields = [
            "id",
            "name",
            "email",
            "business_name",
            "craft_type",
            "phone",
            "address",
            "bio",
            "profile_image",
            "verification_status",
            "created_at",
        ]

    def get_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()

class ArtisanProfileDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    location = serializers.CharField(
        source="address",
        read_only=True,
    )

    class Meta:
        model = ArtisanProfile
        fields = [
            "id",
            "name",
            "craft_type",
            "location",
            "bio",
            "profile_image",
        ]
class ArtisanOwnProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        source="user.first_name",
        read_only=True
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True
    )

    location = serializers.CharField(
        source="address",
        read_only=True
    )

    status = serializers.CharField(
        source="verification_status",
        read_only=True
    )

    class Meta:
        model = ArtisanProfile
        fields = [
            "id",
            "name",
            "email",
            "business_name",
            "craft_type",
            "phone",
            "location",
            "bio",
            "profile_image",
            "status",
        ]
class ArtisanOwnProfileUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        source="user.first_name",
        required=False
    )

    location = serializers.CharField(
        source="address",
        required=False,
        allow_blank=True
    )

    profile_image = serializers.ImageField(
        required=False,
        allow_null=True
    )

    remove_profile_image = serializers.BooleanField(
        required=False,
        write_only=True
    )

    class Meta:
        model = ArtisanProfile
        fields = [
            "name",
            "business_name",
            "craft_type",
            "phone",
            "location",
            "bio",
            "profile_image",
            "remove_profile_image",
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        remove_image = validated_data.pop(
            "remove_profile_image", False
        )

        if "first_name" in user_data:
            instance.user.first_name = user_data["first_name"]
            instance.user.save(update_fields=["first_name"])

        if remove_image and instance.profile_image:
            instance.profile_image.delete(save=False)

        return super().update(instance, validated_data)

    
class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id",
            "full_name",
            "phone",
            "address_line",
            "city",
            "state",
            "pincode",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]