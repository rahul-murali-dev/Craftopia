
import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q


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

        ARTISAN_REJECTION_RESTORATION = (
            "ARTISAN_REJECTION_RESTORATION",
            "Artisan Rejection Restoration"
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


class ArtisanOrderResponse(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"

    class RejectionReason(models.TextChoices):
        OUT_OF_STOCK = "OUT_OF_STOCK", "Out of Stock"

        PRODUCT_UNAVAILABLE = (
            "PRODUCT_UNAVAILABLE",
            "Product Currently Unavailable"
        )

        UNABLE_TO_PREPARE = (
            "UNABLE_TO_PREPARE",
            "Unable to Prepare"
        )

        CUSTOM_ORDER_NOT_POSSIBLE = (
            "CUSTOM_ORDER_NOT_POSSIBLE",
            "Custom Order Not Possible"
        )

        OTHER = "OTHER", "Other"

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="artisan_responses"
    )

    artisan = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="artisan_order_responses"
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    rejection_reason = models.CharField(
        max_length=40,
        choices=RejectionReason.choices,
        blank=True,
        default=""
    )

    response_note = models.TextField(
        blank=True,
        default=""
    )

    responded_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["order", "artisan"],
                name="unique_artisan_response_per_order"
            ),
        ]

    def __str__(self):
        return (
            f"{self.order.order_number} - "
            f"{self.artisan.username} - "
            f"{self.status}"
        )


class ArtisanRefund(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSED = "PROCESSED", "Processed"
        FAILED = "FAILED", "Failed"

    payment = models.ForeignKey(
        Payment,
        on_delete=models.PROTECT,
        related_name="artisan_refunds"
    )

    artisan_response = models.OneToOneField(
        ArtisanOrderResponse,
        on_delete=models.PROTECT,
        related_name="refund"
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator("0.01")]
    )

    razorpay_refund_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    failure_reason = models.TextField(
        blank=True,
        default=""
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(amount__gt=0),
                name="artisan_refund_amount_positive"
            ),
        ]

    def __str__(self):
        return f"Refund - {self.artisan_response}"
