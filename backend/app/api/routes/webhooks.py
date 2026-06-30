import logging
import uuid

import stripe
from fastapi import APIRouter, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import AsyncSessionLocal
from app.models.user import Tier, User
from app.services.billing_service import tier_from_value

logger = logging.getLogger(__name__)
settings = get_settings()
stripe.api_key = settings.stripe_secret_key

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


async def _find_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    try:
        parsed_id = uuid.UUID(user_id)
    except ValueError:
        return None
    return await db.get(User, parsed_id)


async def _find_user_by_stripe_customer(db: AsyncSession, customer_id: str) -> User | None:
    result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
    return result.scalar_one_or_none()


@router.post("/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="stripe-signature"),
) -> dict[str, bool]:
    if stripe_signature is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Stripe signature")

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=settings.stripe_webhook_secret,
        )
    except (ValueError, stripe.SignatureVerificationError) as exc:
        logger.warning("Stripe webhook signature verification failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature") from exc

    event_type: str = event["type"]
    data_object = event["data"]["object"]

    async with AsyncSessionLocal() as db:
        if event_type == "checkout.session.completed":
            client_reference_id = data_object.get("client_reference_id")
            customer_id = data_object.get("customer")
            subscription_id = data_object.get("subscription")
            tier = tier_from_value((data_object.get("metadata") or {}).get("tier", "pro"))
            user = await _find_user_by_id(db, client_reference_id) if client_reference_id else None
            if user is not None:
                user.tier = tier
                if customer_id:
                    user.stripe_customer_id = customer_id
                if subscription_id:
                    user.stripe_subscription_id = subscription_id
                await db.commit()
            else:
                logger.warning(
                    "checkout.session.completed for unknown user reference %s", client_reference_id
                )

        elif event_type in {"customer.subscription.updated", "customer.subscription.deleted"}:
            customer_id = data_object.get("customer")
            subscription_status = data_object.get("status")
            tier = tier_from_value((data_object.get("metadata") or {}).get("tier", "pro"))
            user = await _find_user_by_stripe_customer(db, customer_id) if customer_id else None
            if user is not None:
                user.tier = tier if subscription_status in {"active", "trialing"} else Tier.FREE
                if event_type == "customer.subscription.deleted":
                    user.stripe_subscription_id = None
                await db.commit()
            else:
                logger.warning("Subscription event for unknown Stripe customer %s", customer_id)

    return {"received": True}
