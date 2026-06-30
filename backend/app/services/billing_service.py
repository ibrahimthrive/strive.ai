from datetime import datetime, timezone

import stripe

from app.core.config import get_settings
from app.models.user import Tier, User
from app.schemas.billing import InvoiceOut, PaymentMethodOut, PlanOut, SubscriptionOut

settings = get_settings()
stripe.api_key = settings.stripe_secret_key

_PRICE_ID_BY_TIER: dict[str, str | None] = {
    "pro": settings.stripe_pro_price_id,
    "business": settings.stripe_business_price_id,
}


class PlanUnavailableError(Exception):
    """Raised when checkout is requested for a tier whose Stripe price isn't configured."""


class NoActiveSubscriptionError(Exception):
    """Raised when an action (cancel/resume) is attempted without an active Stripe subscription."""


def price_id_for_tier(tier: str) -> str:
    price_id = _PRICE_ID_BY_TIER.get(tier)
    if not price_id:
        raise PlanUnavailableError(f"The {tier} plan isn't available yet.")
    return price_id


def _to_datetime(epoch_seconds: int | None) -> datetime | None:
    return datetime.fromtimestamp(epoch_seconds, tz=timezone.utc) if epoch_seconds is not None else None


def get_plans() -> list[PlanOut]:
    plans = [
        PlanOut(
            tier="free",
            available=True,
            unit_amount=0,
            currency="usd",
            interval=None,
            upload_limit_per_day=settings.free_tier_daily_upload_limit,
        )
    ]
    for tier in ("pro", "business"):
        price_id = _PRICE_ID_BY_TIER.get(tier)
        if not price_id:
            plans.append(PlanOut(tier=tier, available=False))
            continue
        price = stripe.Price.retrieve(price_id)
        plans.append(
            PlanOut(
                tier=tier,
                available=True,
                unit_amount=price.unit_amount,
                currency=price.currency,
                interval=price.recurring.interval if price.recurring else None,
            )
        )
    return plans


def create_checkout_session(user: User, tier: str) -> str:
    price_id = price_id_for_tier(tier)
    session = stripe.checkout.Session.create(
        mode="subscription",
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        customer_email=user.email,
        client_reference_id=str(user.id),
        metadata={"tier": tier},
        subscription_data={"metadata": {"tier": tier}},
        success_url=f"{settings.frontend_url}/billing/success",
        cancel_url=f"{settings.frontend_url}/billing/cancel",
    )
    if session.url is None:
        raise RuntimeError("Stripe did not return a checkout URL")
    return session.url


def create_portal_session(user: User) -> str:
    if not user.stripe_customer_id:
        raise NoActiveSubscriptionError("No billing account yet — subscribe to a plan first.")
    session = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{settings.frontend_url}/billing/manage",
    )
    return session.url


def get_subscription(user: User) -> SubscriptionOut:
    if not user.stripe_subscription_id:
        return SubscriptionOut(tier=user.tier.value, status="none")
    subscription = stripe.Subscription.retrieve(user.stripe_subscription_id)
    return SubscriptionOut(
        tier=user.tier.value,
        status=subscription.status,
        current_period_end=_to_datetime(subscription.current_period_end),
        cancel_at_period_end=bool(subscription.cancel_at_period_end),
    )


def list_invoices(user: User) -> list[InvoiceOut]:
    if not user.stripe_customer_id:
        return []
    invoices = stripe.Invoice.list(customer=user.stripe_customer_id, limit=24)
    return [
        InvoiceOut(
            id=invoice.id,
            amount_paid=invoice.amount_paid,
            currency=invoice.currency,
            status=invoice.status,
            created=_to_datetime(invoice.created),  # type: ignore[arg-type]
            hosted_invoice_url=invoice.hosted_invoice_url,
            invoice_pdf=invoice.invoice_pdf,
        )
        for invoice in invoices.data
    ]


def list_payment_methods(user: User) -> list[PaymentMethodOut]:
    if not user.stripe_customer_id:
        return []
    methods = stripe.PaymentMethod.list(customer=user.stripe_customer_id, type="card")
    customer = stripe.Customer.retrieve(user.stripe_customer_id)
    default_id = customer.invoice_settings.default_payment_method if customer.invoice_settings else None
    return [
        PaymentMethodOut(
            id=method.id,
            brand=method.card.brand,
            last4=method.card.last4,
            exp_month=method.card.exp_month,
            exp_year=method.card.exp_year,
            is_default=method.id == default_id,
        )
        for method in methods.data
    ]


def cancel_subscription(user: User) -> SubscriptionOut:
    if not user.stripe_subscription_id:
        raise NoActiveSubscriptionError("No active subscription to cancel.")
    stripe.Subscription.modify(user.stripe_subscription_id, cancel_at_period_end=True)
    return get_subscription(user)


def resume_subscription(user: User) -> SubscriptionOut:
    if not user.stripe_subscription_id:
        raise NoActiveSubscriptionError("No active subscription to resume.")
    stripe.Subscription.modify(user.stripe_subscription_id, cancel_at_period_end=False)
    return get_subscription(user)


def tier_from_value(value: str) -> Tier:
    try:
        return Tier(value)
    except ValueError:
        return Tier.PRO
