from collections.abc import AsyncGenerator
from typing import Any

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.core.persona import STRIVE_SYSTEM_PROMPT
from app.models.user import Tier
from app.schemas.chat import ChatMessage

settings = get_settings()
_client = AsyncOpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url)


def model_for_tier(tier: Tier) -> str:
    return settings.free_tier_model if tier is Tier.FREE else settings.pro_tier_model


def _message_content(message: ChatMessage) -> str | list[dict[str, Any]]:
    if not message.image_data_url:
        return message.content
    return [
        {"type": "text", "text": message.content},
        {"type": "image_url", "image_url": {"url": message.image_data_url}},
    ]


async def stream_chat_completion(
    messages: list[ChatMessage], tier: Tier, custom_instructions: str | None = None
) -> AsyncGenerator[str, None]:
    model = model_for_tier(tier)
    system_prompt = STRIVE_SYSTEM_PROMPT
    if custom_instructions:
        system_prompt = f"{system_prompt}\n\nThe user has asked you to also follow these instructions:\n{custom_instructions}"
    payload = [
        {"role": "system", "content": system_prompt},
        *({"role": message.role, "content": _message_content(message)} for message in messages),
    ]

    stream = await _client.chat.completions.create(
        model=model,
        messages=payload,  # type: ignore[arg-type]
        stream=True,
    )
    async for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
