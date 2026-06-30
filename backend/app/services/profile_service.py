import secrets
import uuid
from datetime import datetime, timezone

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import hash_password, verify_password
from app.models.api_key import ApiKey
from app.models.user import User

settings = get_settings()
stripe.api_key = settings.stripe_secret_key

API_KEY_PREFIX_LENGTH = 12


class InvalidPasswordError(Exception):
    """Raised when a password confirmation (change-password, delete-account) doesn't match."""


async def update_display_name(db: AsyncSession, user: User, display_name: str | None) -> User:
    user.display_name = display_name.strip() if display_name and display_name.strip() else None
    await db.commit()
    await db.refresh(user)
    return user


async def change_password(db: AsyncSession, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise InvalidPasswordError("Current password is incorrect.")
    user.hashed_password = hash_password(new_password)
    await db.commit()


async def list_api_keys(db: AsyncSession, user_id: uuid.UUID) -> list[ApiKey]:
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == user_id).order_by(ApiKey.created_at.desc()))
    return list(result.scalars().all())


async def create_api_key(db: AsyncSession, user_id: uuid.UUID, name: str) -> tuple[ApiKey, str]:
    raw_key = f"sk_{secrets.token_urlsafe(32)}"
    api_key = ApiKey(
        user_id=user_id,
        name=name.strip()[:60] or "Untitled key",
        key_prefix=raw_key[:API_KEY_PREFIX_LENGTH],
        hashed_key=hash_password(raw_key),
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    return api_key, raw_key


async def revoke_api_key(db: AsyncSession, user_id: uuid.UUID, key_id: uuid.UUID) -> bool:
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user_id))
    api_key = result.scalar_one_or_none()
    if api_key is None or api_key.revoked_at is not None:
        return False
    api_key.revoked_at = datetime.now(timezone.utc)
    await db.commit()
    return True


async def delete_account(db: AsyncSession, user: User, password: str) -> None:
    if not verify_password(password, user.hashed_password):
        raise InvalidPasswordError("Password is incorrect.")

    if user.stripe_subscription_id:
        try:
            stripe.Subscription.cancel(user.stripe_subscription_id)
        except stripe.StripeError:
            pass  # best-effort cleanup; account deletion proceeds regardless

    await db.delete(user)
    await db.commit()
