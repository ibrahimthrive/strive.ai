import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.usage_log import UsageLog

settings = get_settings()


class DailyLimitExceededError(Exception):
    """Raised when a free-tier user has exhausted their daily message quota."""


async def _get_or_create_today_log(db: AsyncSession, user_id: uuid.UUID) -> UsageLog:
    today = datetime.now(timezone.utc).date()
    result = await db.execute(
        select(UsageLog).where(UsageLog.user_id == user_id, UsageLog.last_active_date == today)
    )
    log = result.scalar_one_or_none()
    if log is None:
        log = UsageLog(user_id=user_id, message_count=0, last_active_date=today)
        db.add(log)
        await db.commit()
        await db.refresh(log)
    return log


async def check_free_tier_quota(db: AsyncSession, user_id: uuid.UUID) -> None:
    log = await _get_or_create_today_log(db, user_id)
    if log.message_count >= settings.free_tier_daily_message_limit:
        raise DailyLimitExceededError(
            f"Daily limit of {settings.free_tier_daily_message_limit} messages reached. "
            "Upgrade to Strive Pro for unlimited messages."
        )


async def increment_usage(db: AsyncSession, user_id: uuid.UUID) -> None:
    log = await _get_or_create_today_log(db, user_id)
    log.message_count += 1
    await db.commit()
