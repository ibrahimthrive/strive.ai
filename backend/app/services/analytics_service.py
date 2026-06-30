import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import case, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message, MessageRole
from app.models.usage_log import UsageLog
from app.models.user import Tier, User
from app.schemas.dashboard import ActivityItem, ConversationSummary, DashboardSummary, SeriesPoint, UsageStat

RECENT_CONVERSATIONS_LIMIT = 5
ACTIVITY_LIMIT = 15
WEEKLY_SERIES_DAYS = 7
MONTHLY_SERIES_MONTHS = 6


def estimate_tokens(text: str) -> int:
    """Rough ~4-chars-per-token heuristic; no tokenizer dependency for a dashboard estimate."""
    return max(1, len(text) // 4)


async def _get_or_create_conversation(
    db: AsyncSession, user_id: uuid.UUID, client_id: str, title_hint: str | None
) -> Conversation:
    result = await db.execute(
        select(Conversation).where(Conversation.user_id == user_id, Conversation.client_id == client_id)
    )
    conversation = result.scalar_one_or_none()
    if conversation is None:
        conversation = Conversation(
            user_id=user_id, client_id=client_id, title=(title_hint or "New chat").strip()[:120] or "New chat"
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
    return conversation


async def record_user_message(
    db: AsyncSession, user_id: uuid.UUID, client_id: str, title_hint: str | None, content: str
) -> Conversation:
    conversation = await _get_or_create_conversation(db, user_id, client_id, title_hint)
    db.add(
        Message(
            conversation_id=conversation.id,
            user_id=user_id,
            role=MessageRole.USER,
            content=content,
            token_count=estimate_tokens(content),
        )
    )
    conversation.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return conversation


async def record_assistant_message(
    db: AsyncSession, conversation_id: uuid.UUID, user_id: uuid.UUID, content: str, response_ms: int
) -> None:
    db.add(
        Message(
            conversation_id=conversation_id,
            user_id=user_id,
            role=MessageRole.ASSISTANT,
            content=content,
            token_count=estimate_tokens(content),
            response_ms=response_ms,
        )
    )
    await db.execute(
        update(Conversation).where(Conversation.id == conversation_id).values(updated_at=datetime.now(timezone.utc))
    )
    await db.commit()


async def _role_stats(
    db: AsyncSession,
    user_id: uuid.UUID,
    role: MessageRole,
    today_start: datetime,
    week_start: datetime,
    month_start: datetime,
) -> tuple[UsageStat, UsageStat]:
    stmt = select(
        func.coalesce(func.sum(case((Message.created_at >= today_start, 1), else_=0)), 0),
        func.coalesce(func.sum(case((Message.created_at >= week_start, 1), else_=0)), 0),
        func.coalesce(func.sum(case((Message.created_at >= month_start, 1), else_=0)), 0),
        func.coalesce(func.count(), 0),
        func.coalesce(func.sum(case((Message.created_at >= today_start, Message.token_count), else_=0)), 0),
        func.coalesce(func.sum(case((Message.created_at >= week_start, Message.token_count), else_=0)), 0),
        func.coalesce(func.sum(case((Message.created_at >= month_start, Message.token_count), else_=0)), 0),
        func.coalesce(func.sum(Message.token_count), 0),
    ).where(Message.user_id == user_id, Message.role == role)
    msg_today, msg_week, msg_month, msg_total, tok_today, tok_week, tok_month, tok_total = (
        await db.execute(stmt)
    ).one()
    return (
        UsageStat(today=msg_today, week=msg_week, month=msg_month, total=msg_total),
        UsageStat(today=tok_today, week=tok_week, month=tok_month, total=tok_total),
    )


async def _avg_response_ms(db: AsyncSession, user_id: uuid.UUID, month_start: datetime) -> int | None:
    recent_stmt = select(func.avg(Message.response_ms)).where(
        Message.user_id == user_id,
        Message.role == MessageRole.ASSISTANT,
        Message.response_ms.is_not(None),
        Message.created_at >= month_start,
    )
    avg_value = (await db.execute(recent_stmt)).scalar_one_or_none()
    if avg_value is None:
        all_time_stmt = select(func.avg(Message.response_ms)).where(
            Message.user_id == user_id, Message.role == MessageRole.ASSISTANT, Message.response_ms.is_not(None)
        )
        avg_value = (await db.execute(all_time_stmt)).scalar_one_or_none()
    return int(avg_value) if avg_value is not None else None


async def _recent_conversations(db: AsyncSession, user_id: uuid.UUID) -> list[ConversationSummary]:
    stmt = (
        select(Conversation, func.count(Message.id))
        .outerjoin(Message, Message.conversation_id == Conversation.id)
        .where(Conversation.user_id == user_id, Conversation.archived.is_(False))
        .group_by(Conversation.id)
        .order_by(Conversation.updated_at.desc())
        .limit(RECENT_CONVERSATIONS_LIMIT)
    )
    rows = (await db.execute(stmt)).all()
    return [
        ConversationSummary(
            client_id=conversation.client_id,
            title=conversation.title,
            pinned=conversation.pinned,
            message_count=message_count,
            updated_at=conversation.updated_at,
        )
        for conversation, message_count in rows
    ]


async def _weekly_series(db: AsyncSession, user_id: uuid.UUID, today_start: datetime) -> list[SeriesPoint]:
    since = today_start - timedelta(days=WEEKLY_SERIES_DAYS - 1)
    stmt = (
        select(func.date_trunc("day", Message.created_at).label("day"), func.count())
        .where(Message.user_id == user_id, Message.role == MessageRole.USER, Message.created_at >= since)
        .group_by("day")
    )
    rows = (await db.execute(stmt)).all()
    counts_by_day = {row[0].date(): row[1] for row in rows}

    days = [today_start.date() - timedelta(days=i) for i in range(WEEKLY_SERIES_DAYS - 1, -1, -1)]
    return [SeriesPoint(label=day.strftime("%a"), value=counts_by_day.get(day, 0)) for day in days]


async def _monthly_series(db: AsyncSession, user_id: uuid.UUID, now: datetime) -> list[SeriesPoint]:
    since = now - timedelta(days=31 * MONTHLY_SERIES_MONTHS)
    stmt = (
        select(func.date_trunc("month", Message.created_at).label("month"), func.count())
        .where(Message.user_id == user_id, Message.role == MessageRole.USER, Message.created_at >= since)
        .group_by("month")
    )
    rows = (await db.execute(stmt)).all()
    counts_by_month = {(row[0].year, row[0].month): row[1] for row in rows}

    buckets: list[tuple[int, int]] = []
    year, month = now.year, now.month
    for i in range(MONTHLY_SERIES_MONTHS - 1, -1, -1):
        m = month - i
        y = year
        while m <= 0:
            m += 12
            y -= 1
        buckets.append((y, m))

    return [
        SeriesPoint(label=date(y, m, 1).strftime("%b"), value=counts_by_month.get((y, m), 0)) for y, m in buckets
    ]


async def _activity(db: AsyncSession, user_id: uuid.UUID) -> list[ActivityItem]:
    stmt = (
        select(Message.content, Message.created_at, Conversation.title)
        .join(Conversation, Conversation.id == Message.conversation_id)
        .where(Message.user_id == user_id, Message.role == MessageRole.USER)
        .order_by(Message.created_at.desc())
        .limit(ACTIVITY_LIMIT)
    )
    rows = (await db.execute(stmt)).all()
    return [
        ActivityItem(conversation_title=title, preview=content[:80], created_at=created_at)
        for content, created_at, title in rows
    ]


async def get_dashboard_summary(db: AsyncSession, user: User, free_tier_daily_upload_limit: int) -> DashboardSummary:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)
    today = today_start.date()

    messages_sent, user_tokens = await _role_stats(db, user.id, MessageRole.USER, today_start, week_start, month_start)
    ai_requests, assistant_tokens = await _role_stats(
        db, user.id, MessageRole.ASSISTANT, today_start, week_start, month_start
    )
    tokens_used = UsageStat(
        today=user_tokens.today + assistant_tokens.today,
        week=user_tokens.week + assistant_tokens.week,
        month=user_tokens.month + assistant_tokens.month,
        total=user_tokens.total + assistant_tokens.total,
    )

    storage_stmt = select(func.coalesce(func.sum(func.length(Message.content)), 0)).where(Message.user_id == user.id)
    storage_bytes = (await db.execute(storage_stmt)).scalar_one()

    uploads_total_stmt = select(func.coalesce(func.sum(UsageLog.upload_count), 0)).where(UsageLog.user_id == user.id)
    files_uploaded = (await db.execute(uploads_total_stmt)).scalar_one()

    uploads_today_stmt = select(UsageLog.upload_count).where(
        UsageLog.user_id == user.id, UsageLog.last_active_date == today
    )
    uploads_today = (await db.execute(uploads_today_stmt)).scalar_one_or_none() or 0
    remaining_uploads = max(free_tier_daily_upload_limit - uploads_today, 0) if user.tier == Tier.FREE else None

    return DashboardSummary(
        messages_sent=messages_sent,
        ai_requests=ai_requests,
        tokens_used=tokens_used,
        avg_response_ms=await _avg_response_ms(db, user.id, month_start),
        storage_bytes=storage_bytes,
        files_uploaded=files_uploaded,
        remaining_uploads=remaining_uploads,
        recent_conversations=await _recent_conversations(db, user.id),
        weekly_series=await _weekly_series(db, user.id, today_start),
        monthly_series=await _monthly_series(db, user.id, now),
        activity=await _activity(db, user.id),
    )
