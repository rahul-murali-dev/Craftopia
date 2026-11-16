
import razorpay

from django.conf import settings
from decimal import Decimal


def get_razorpay_client():

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise ValueError("Razorpay API keys are not configured.")

    return razorpay.Client(
        auth=(
            settings.RAZORPAY_KEY_ID,
            settings.RAZORPAY_KEY_SECRET
        )
    )


def create_razorpay_order(amount, receipt):

    client = get_razorpay_client()

    amount_in_paise = int(
        Decimal(str(amount)) * 100
    )

    data = {
    "amount": amount_in_paise,
    "currency": "INR",
    "receipt": str(receipt)[:40],
}

    return client.order.create(data=data)


def verify_razorpay_signature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
):

    client = get_razorpay_client()

    client.utility.verify_payment_signature({
        "razorpay_order_id": razorpay_order_id,
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_signature": razorpay_signature,
    })

    return True

def create_razorpay_refund(payment_id, amount):
    client = get_razorpay_client()

    amount_in_paise = int(
        Decimal(str(amount)) * 100
    )

    if amount_in_paise <= 0:
        raise ValueError("Refund amount must be greater than zero.")

    return client.payment.refund(
        payment_id,
        {
            "amount": amount_in_paise,
            "speed": "normal",
        }
    )

