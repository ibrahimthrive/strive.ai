import logging
import time
from collections.abc import AsyncGenerator
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import AsyncSessionLocal, get_db
from app.models.user import Tier, User
from app.schemas.chat import ChatRequest
from app.services.analytics_service import record_assistant_message, record_user_message
from app.services.openai_service import stream_chat_completion
from app.services.settings_service import get_or_create_settings
from app.services.usage_service import DailyLimitExceededError, check_free_tier_quota, increment_usage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("")
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    if current_user.tier == Tier.FREE:
        try:
            await check_free_tier_quota(db, current_user.id)
        except DailyLimitExceededError as exc:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc

    user_id: UUID = current_user.id
    tier: Tier = current_user.tier

    user_settings = await get_or_create_settings(db, user_id)
    custom_instructions = user_settings.custom_instructions

    conversation_id: UUID | None = None
    if request.conversation_id:
        try:
            last_user_message = next(m for m in reversed(request.messages) if m.role == "user")
            conversation = await record_user_message(
                db, user_id, request.conversation_id, request.conversation_title, last_user_message.content
            )
            conversation_id = conversation.id
        except Exception:
            logger.exception("Failed to record user message for user %s", user_id)

    async def event_stream() -> AsyncGenerator[str, None]:
        chunks: list[str] = []
        started_at = time.monotonic()
        try:
            async for token in stream_chat_completion(request.messages, tier, custom_instructions):
                chunks.append(token)
                yield token
        except Exception:
            logger.exception("OpenAI streaming failed for user %s", user_id)
            yield "\n\n[Strive hit an error generating a response. Please try again.]"
            return

        response_ms = int((time.monotonic() - started_at) * 1000)
        try:
            async with AsyncSessionLocal() as usage_db:
                await increment_usage(usage_db, user_id)
                if conversation_id is not None:
                    await record_assistant_message(usage_db, conversation_id, user_id, "".join(chunks), response_ms)
        except Exception:
            logger.exception("Failed to record usage for user %s", user_id)

    return StreamingResponse(event_stream(), media_type="text/plain; charset=utf-8")
