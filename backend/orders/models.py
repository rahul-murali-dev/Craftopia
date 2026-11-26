
import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q


class Coupon(models.Model):

    class DiscountType(models.TextChoices):
        PERCENTAGE = "PERCENTAGE", "Percentage Discount"
        FIXED = "FIXED", "Fixed Amount Discount"

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True
    )

    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices
    )

    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))]
    )

    min_order_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))]
    )

    max_discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.01"))]
    )

    start_date = models.DateTimeField()
    expiry_date = models.DateTimeField()

    max_total_usage = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Total usage limit across all customers. Null = unlimited."
    )

    max_usage_per_customer = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Maximum times a single customer can use this coupon."
    )

    total_used_count = models.PositiveIntegerField(
        default=0
    )

    is_active = models.BooleanField(
        default=True
    )

    is_deleted = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=Q(discount_value__gt=0),
                name="coupon_discount_value_positive"
            ),
            models.CheckConstraint(
                condition=Q(min_order_amount__gte=0),
                name="coupon_min_order_amount_non_negative"
            ),
        ]

    def __str__(self):
        return f"{self.code} ({self.discount_type}: {self.discount_value})"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.code:
            self.code = self.code.strip().upper()
        if self.expiry_date and self.start_date and self.expiry_date <= self.start_date:
            raise ValidationError({"expiry_date": "Expiry date must be after start date."})
        if self.discount_type == self.DiscountType.PERCENTAGE and self.discount_value > 100:
            raise ValidationError({"discount_value": "Percentage discount cannot exceed 100%."})

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.strip().upper()
        super().save(*args, **kwargs)


class Order(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        SHIPPED = "SHIPPED", "Shipped"
        OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out for Delivery"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders"
    )

    order_number = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False
    )

    checkout_key = models.UUIDField(
        unique=True,
        null=True,
        blank=True,
        editable=False
    )

    address = models.ForeignKey(
        "users.Address",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders"
    )

    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address_line = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )

    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders"
    )

    coupon_code = models.CharField(
        max_length=50,
        blank=True,
        default=""
    )

    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(0)]
    )

    shipping_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )

    tax = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    cancellation_reason = models.TextField(
        blank=True,
        default=""
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.CheckConstraint(
                condition=Q(subtotal__gte=0),
                name="order_subtotal_non_negative"
            ),
            models.CheckConstraint(
                condition=Q(discount_amount__gte=0),
                name="order_discount_non_negative"
            ),
            models.CheckConstraint(
                condition=Q(shipping_charge__gte=0),
                name="order_shipping_non_negative"
            ),
            models.CheckConstraint(
                condition=Q(tax__gte=0),
                name="order_tax_non_negative"
            ),
            models.CheckConstraint(
                condition=Q(total_amount__gte=0),
                name="order_total_non_negative"
            ),
        ]

    def __str__(self):
        return str(self.order_number)


class CouponUsage(models.Model):

    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.PROTECT,
        related_name="usages"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="coupon_usages"
    )

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="coupon_redemptions"
    )

    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["coupon", "order"],
                name="unique_coupon_per_order"
            ),
            models.CheckConstraint(
                condition=Q(discount_amount__gte=0),
                name="coupon_usage_discount_non_negative"
            ),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.coupon.code} - Order #{self.order_id}"



class OrderItem(models.Model):

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )

    product = models.ForeignKey(
        "product.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items"
    )

    product_name = models.CharField(max_length=200)

    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    # Individual item cancellation tracking
    is_cancelled = models.BooleanField(default=False)

    cancellation_reason = models.TextField(
        blank=True,
        default=""
    )

    cancelled_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

        constraints = [
            models.CheckConstraint(
                condition=Q(unit_price__gte=0),
                name="order_item_price_non_negative"
            ),
            models.CheckConstraint(
                condition=Q(quantity__gte=1),
                name="order_item_quantity_positive"
            ),
            models.CheckConstraint(
                condition=Q(subtotal__gte=0),
                name="order_item_subtotal_non_negative"
            ),
        ]

    def __str__(self):
        return f"{self.product_name} - {self.quantity}"

class Payment(models.Model):

    class Method(models.TextChoices):
        COD = "COD", "Cash on Delivery"
        RAZORPAY = "RAZORPAY", "Razorpay"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"
        REFUND_PENDING = "REFUND_PENDING", "Refund Pending"
        REFUND_FAILED = "REFUND_FAILED", "Refund Failed"
        REFUNDED = "REFUNDED", "Refunded"

    order = models.ForeignKey(
        Order,
        on_delete=models.PROTECT,
        related_name="payments"
    )

    payment_method = models.CharField(
        max_length=20,
        choices=Method.choices
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    razorpay_order_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )

    razorpay_payment_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )

    razorpay_refund_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )

    signature_verified = models.BooleanField(default=False)

    failure_reason = models.TextField(
        blank=True,
        default=""
    )
    cod_collected_at = models.DateTimeField(
    null=True,
    blank=True
)

    cod_collected_by = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="cod_collected_payments"
)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.CheckConstraint(
                condition=Q(amount__gte=0),
                name="payment_amount_non_negative"
            ),
        ]

    def __str__(self):
        return (
            f"{self.order.order_number} - "
            f"{self.payment_method} - "
            f"{self.status}"
        )


class ReturnRequest(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        COMPLETED = "COMPLETED", "Completed"

    order = models.ForeignKey(
        Order,
        on_delete=models.PROTECT,
        related_name="return_requests"
    )

    reason = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_return_requests"
    )

    admin_note = models.TextField(
        blank=True,
        default=""
    )

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"Return request - "
            f"{self.order.order_number} - "
            f"{self.status}"
        )


class StockAdjustment(models.Model):

    class AdjustmentType(models.TextChoices):
        DEDUCTION = "DEDUCTION", "Stock Deduction"

        CANCELLATION_RESTORATION = (
            "CANCELLATION_RESTORATION",
            "Cancellation Restoration"
        )

        RETURN_RESTORATION = (
            "RETURN_RESTORATION",
            "Return Restoration"
        )
    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.PROTECT,
        related_name="stock_adjustments"
    )

    product = models.ForeignKey(
        "product.Product",
        on_delete=models.PROTECT,
        related_name="stock_adjustments"
    )

    adjustment_type = models.CharField(
        max_length=30,
        choices=AdjustmentType.choices
    )

    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    reference = models.CharField(
        max_length=150,
        unique=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.CheckConstraint(
                condition=Q(quantity__gte=1),
                name="stock_adjustment_quantity_positive"
            ),
        ]

    def __str__(self):
        return (
            f"{self.product.name} - "
            f"{self.adjustment_type} - "
            f"{self.quantity}"
        )