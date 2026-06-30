import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.models.user_settings import UserSettings
from app.schemas.profile import ProfileOut
from app.schemas.settings import ExportDataOut, ExportedConversation, ExportedMessage, UserSettingsUpdate


async def get_or_create_settings(db: AsyncSession, user_id: uuid.UUID) -> UserSettings:
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


async def update_settings(db: AsyncSession, user_id: uuid.UUID, patch: UserSettingsUpdate) -> UserSettings:
    settings = await get_or_create_settings(db, user_id)
    for field, value in patch.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    await db.commit()
    await db.refresh(settings)
    return settings


async def export_user_data(db: AsyncSession, user: User) -> ExportDataOut:
    result = await db.execute(
        select(Conversation).where(Conversation.user_id == user.id).order_by(Conversation.created_at.asc())
    )
    conversations = result.scalars().all()

    exported: list[ExportedConversation] = []
    for conversation in conversations:
        message_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
        )
        messages = message_result.scalars().all()
        exported.append(
            ExportedConversation(
                title=conversation.title,
                pinned=conversation.pinned,
                favorited=conversation.favorited,
                archived=conversation.archived,
                created_at=conversation.created_at,
                updated_at=conversation.updated_at,
                messages=[
                    ExportedMessage(role=message.role.value, content=message.content, created_at=message.created_at)
                    for message in messages
                ],
            )
        )

    return ExportDataOut(profile=ProfileOut.model_validate(user, from_attributes=True), conversations=exported)
