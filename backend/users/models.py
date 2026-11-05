
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        ARTISAN = "ARTISAN", "Artisan"
        ADMIN = "ADMIN", "Admin"

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )

    email_verified = models.BooleanField(default=False)

    pending_email = models.EmailField(
    blank=True,
    default=""
)
    # Customer Profile Fields
    phone = models.CharField(
        max_length=20,
        blank=True,
        default=""
    )

    profile_image = models.ImageField(
        upload_to="users/",
        blank=True,
        null=True
    )

    def __str__(self):
        return self.username


class ArtisanProfile(models.Model):

    class VerificationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="artisan_profile"
    )

    business_name = models.CharField(max_length=255)
    craft_type = models.CharField(max_length=100, default="")
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True, default="")
    bio = models.TextField(blank=True, default="")

    profile_image = models.ImageField(
        upload_to="artisans/",
        blank=True,
        null=True,
    )

    verification_status = models.CharField(
        max_length=10,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.business_name


class EmailOTP(models.Model):

    PURPOSE_CHOICES = [
        ("registration", "Registration"),
        ("change_email", "Change Email"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="email_otps"
    )

    otp = models.CharField(max_length=6)

    purpose = models.CharField(
        max_length=20,
        choices=PURPOSE_CHOICES,
        default="registration"
    )

    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.purpose} OTP for {self.user.email}"

class Address(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="addresses"
    )

    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)

    address_line = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)

    is_default = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} - {self.city}"    