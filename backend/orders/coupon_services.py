
from decimal import Decimal, ROUND_HALF_UP

from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import F
from django.utils import timezone

from .models import Coupon, CouponUsage


def validate_and_calculate_coupon(
    coupon_code,
    user,
    eligible_subtotal,
    lock=False
):
    """
    Validates a coupon and calculates its discount.

    When lock=True, the coupon row is locked using select_for_update().
    This must be called inside transaction.atomic() for effective
    concurrency protection.
    """

    if not coupon_code or not str(coupon_code).strip():
        raise ValidationError({
            "coupon_code": "Please enter a coupon code."
        })

    code_clean = str(coupon_code).strip().upper()

    coupon_qs = Coupon.objects.all()

    if lock:
        coupon_qs = coupon_qs.select_for_update()

    try:
        coupon = coupon_qs.get(
            code__iexact=code_clean,
            is_deleted=False
        )
    except Coupon.DoesNotExist:
        raise ValidationError({
            "coupon_code": "Invalid coupon code."
        })

    if not coupon.is_active:
        raise ValidationError({
            "coupon_code": "This coupon is currently inactive."
        })

    now = timezone.now()

    if now < coupon.start_date:
        raise ValidationError({
            "coupon_code": "This coupon is not valid yet."
        })

    if now > coupon.expiry_date:
        raise ValidationError({
            "coupon_code": "This coupon has expired."
        })

    eligible_subtotal = Decimal(str(eligible_subtotal))

    if eligible_subtotal <= Decimal("0.00"):
        raise ValidationError({
            "coupon_code": "Eligible order subtotal must be greater than zero."
        })

    if eligible_subtotal < coupon.min_order_amount:
        raise ValidationError({
            "coupon_code": (
                f"Minimum order amount of "
                f"₹{coupon.min_order_amount:.2f} is required for this coupon."
            )
        })

    # Global usage limit
    if coupon.max_total_usage is not None:
        usage_count = CouponUsage.objects.filter(
            coupon=coupon
        ).count()

        current_total_usage = max(
            coupon.total_used_count,
            usage_count
        )

        if current_total_usage >= coupon.max_total_usage:
            raise ValidationError({
                "coupon_code": (
                    "This coupon has reached its maximum usage limit."
                )
            })

    # Per-customer usage limit
    if user and user.is_authenticated:
        user_usage_count = CouponUsage.objects.filter(
            coupon=coupon,
            user=user
        ).count()

        if user_usage_count >= coupon.max_usage_per_customer:
            if coupon.max_usage_per_customer == 1:
                message = "You have already used this coupon."
            else:
                message = (
                    "You have already redeemed this coupon the maximum "
                    f"allowed times ({coupon.max_usage_per_customer})."
                )

            raise ValidationError({
                "coupon_code": message
            })

    # Calculate discount
    if coupon.discount_type == Coupon.DiscountType.PERCENTAGE:
        raw_discount = (
            eligible_subtotal * coupon.discount_value
        ) / Decimal("100")

        if (
            coupon.max_discount_amount
            and coupon.max_discount_amount > 0
        ):
            discount_amount = min(
                raw_discount,
                coupon.max_discount_amount
            )
        else:
            discount_amount = raw_discount

    elif coupon.discount_type == Coupon.DiscountType.FIXED:
        discount_amount = min(
            coupon.discount_value,
            eligible_subtotal
        )

    else:
        raise ValidationError({
            "coupon_code": "Unsupported coupon discount type."
        })

    discount_amount = discount_amount.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )

    discount_amount = min(
        discount_amount,
        eligible_subtotal
    )

    discount_amount = max(
        Decimal("0.00"),
        discount_amount
    )

    new_subtotal = (
        eligible_subtotal - discount_amount
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )

    return {
        "coupon": coupon,
        "coupon_code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "discount_amount": discount_amount,
        "eligible_subtotal": eligible_subtotal,
        "new_subtotal": new_subtotal,
    }


@transaction.atomic
def record_coupon_redemption(order, coupon, discount_amount):
    """
    Records coupon redemption idempotently and increments usage count.

    The coupon row is locked to prevent concurrent updates to its
    usage counter.
    """

    if not order or not coupon:
        return None

    locked_coupon = Coupon.objects.select_for_update().get(
        id=coupon.id
    )

    usage, created = CouponUsage.objects.get_or_create(
        coupon=locked_coupon,
        order=order,
        defaults={
            "user": order.user,
            "discount_amount": discount_amount,
        }
    )

    if created:
        Coupon.objects.filter(
            id=locked_coupon.id
        ).update(
            total_used_count=F("total_used_count") + 1
        )

    return usage


@transaction.atomic
def revert_coupon_redemption(order):
    """
    Reverts coupon redemption when an order is cancelled.

    Decrements the coupon usage counter and deletes the corresponding
    CouponUsage record inside one database transaction.

    Call this only for orders eligible for coupon redemption reversal.
    """

    if not order:
        return

    usages = list(
        CouponUsage.objects.filter(
            order=order
        ).select_related("coupon")
    )

    for usage in usages:

        # Lock coupon row before changing its usage counter
        Coupon.objects.select_for_update().get(
            id=usage.coupon_id
        )

        Coupon.objects.filter(
            id=usage.coupon_id
        ).update(
            total_used_count=models.Case(
                models.When(
                    total_used_count__gt=0,
                    then=F("total_used_count") - 1
                ),
                default=0,
                output_field=models.PositiveIntegerField()
            )
        )

        usage.delete()
