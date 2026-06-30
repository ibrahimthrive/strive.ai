import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.folder import Folder
from app.models.message import Message
from app.schemas.conversation import ConversationOut, ConversationSort, ConversationUpdate, ConversationView
from app.schemas.folder import FolderOut
from app.services.analytics_service import _get_or_create_conversation

MAX_CONVERSATIONS = 200


def _to_conversation_out(conversation: Conversation, message_count: int) -> ConversationOut:
    return ConversationOut(
        client_id=conversation.client_id,
        title=conversation.title,
        pinned=conversation.pinned,
        favorited=conversation.favorited,
        archived=conversation.archived,
        folder_id=conversation.folder_id,
        message_count=message_count,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


async def list_conversations(
    db: AsyncSession,
    user_id: uuid.UUID,
    *,
    folder_id: uuid.UUID | None = None,
    view: ConversationView = ConversationView.ACTIVE,
    q: str | None = None,
    sort: ConversationSort = ConversationSort.UPDATED_DESC,
) -> list[ConversationOut]:
    stmt = (
        select(Conversation, func.count(Message.id))
        .outerjoin(Message, Message.conversation_id == Conversation.id)
        .where(Conversation.user_id == user_id)
        .group_by(Conversation.id)
    )

    if view == ConversationView.ARCHIVED:
        stmt = stmt.where(Conversation.archived.is_(True))
    else:
        stmt = stmt.where(Conversation.archived.is_(False))
        if view == ConversationView.PINNED:
            stmt = stmt.where(Conversation.pinned.is_(True))
        elif view == ConversationView.FAVORITED:
            stmt = stmt.where(Conversation.favorited.is_(True))

    if folder_id is not None:
        stmt = stmt.where(Conversation.folder_id == folder_id)

    if q:
        message_match = select(Message.conversation_id).where(
            Message.user_id == user_id, Message.content.ilike(f"%{q}%")
        )
        stmt = stmt.where(or_(Conversation.title.ilike(f"%{q}%"), Conversation.id.in_(message_match)))

    if sort == ConversationSort.UPDATED_ASC:
        stmt = stmt.order_by(Conversation.updated_at.asc())
    elif sort == ConversationSort.TITLE_ASC:
        stmt = stmt.order_by(Conversation.title.asc())
    elif sort == ConversationSort.CREATED_DESC:
        stmt = stmt.order_by(Conversation.created_at.desc())
    else:
        stmt = stmt.order_by(Conversation.updated_at.desc())

    rows = (await db.execute(stmt.limit(MAX_CONVERSATIONS))).all()
    return [_to_conversation_out(conversation, message_count) for conversation, message_count in rows]


async def update_conversation(
    db: AsyncSession, user_id: uuid.UUID, client_id: str, patch: ConversationUpdate
) -> ConversationOut:
    conversation = await _get_or_create_conversation(db, user_id, client_id, patch.title)

    fields = patch.model_dump(exclude_unset=True)
    for field in ("title", "pinned", "favorited", "archived", "folder_id"):
        if field in fields:
            setattr(conversation, field, fields[field])
    conversation.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(conversation)

    message_count = (
        await db.execute(select(func.count(Message.id)).where(Message.conversation_id == conversation.id))
    ).scalar_one()
    return _to_conversation_out(conversation, message_count)


async def _get_conversation_by_client_id(db: AsyncSession, user_id: uuid.UUID, client_id: str) -> Conversation | None:
    result = await db.execute(
        select(Conversation).where(Conversation.user_id == user_id, Conversation.client_id == client_id)
    )
    return result.scalar_one_or_none()


async def delete_conversation(db: AsyncSession, user_id: uuid.UUID, client_id: str) -> None:
    conversation = await _get_conversation_by_client_id(db, user_id, client_id)
    if conversation is None:
        return
    await db.delete(conversation)
    await db.commit()


async def enable_share(db: AsyncSession, user_id: uuid.UUID, client_id: str) -> str | None:
    conversation = await _get_conversation_by_client_id(db, user_id, client_id)
    if conversation is None:
        return None
    if not conversation.share_token:
        conversation.share_token = secrets.token_urlsafe(16)
        await db.commit()
        await db.refresh(conversation)
    return conversation.share_token


async def disable_share(db: AsyncSession, user_id: uuid.UUID, client_id: str) -> bool:
    conversation = await _get_conversation_by_client_id(db, user_id, client_id)
    if conversation is None:
        return False
    conversation.share_token = None
    await db.commit()
    return True


async def get_shared_conversation(db: AsyncSession, token: str) -> Conversation | None:
    result = await db.execute(select(Conversation).where(Conversation.share_token == token))
    return result.scalar_one_or_none()


async def list_messages_for_conversation(db: AsyncSession, conversation_id: uuid.UUID) -> list[Message]:
    result = await db.execute(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    )
    return list(result.scalars().all())


async def list_folders(db: AsyncSession, user_id: uuid.UUID) -> list[FolderOut]:
    stmt = (
        select(Folder, func.count(Conversation.id))
        .outerjoin(Conversation, Conversation.folder_id == Folder.id)
        .where(Folder.user_id == user_id)
        .group_by(Folder.id)
        .order_by(Folder.created_at.asc())
    )
    rows = (await db.execute(stmt)).all()
    return [
        FolderOut(id=folder.id, name=folder.name, created_at=folder.created_at, conversation_count=count)
        for folder, count in rows
    ]


async def create_folder(db: AsyncSession, user_id: uuid.UUID, name: str) -> FolderOut:
    folder = Folder(user_id=user_id, name=name.strip()[:60] or "Untitled")
    db.add(folder)
    await db.commit()
    await db.refresh(folder)
    return FolderOut(id=folder.id, name=folder.name, created_at=folder.created_at, conversation_count=0)


async def update_folder(db: AsyncSession, user_id: uuid.UUID, folder_id: uuid.UUID, name: str) -> FolderOut | None:
    result = await db.execute(select(Folder).where(Folder.user_id == user_id, Folder.id == folder_id))
    folder = result.scalar_one_or_none()
    if folder is None:
        return None
    folder.name = name.strip()[:60] or folder.name
    await db.commit()
    await db.refresh(folder)
    count = (
        await db.execute(select(func.count(Conversation.id)).where(Conversation.folder_id == folder.id))
    ).scalar_one()
    return FolderOut(id=folder.id, name=folder.name, created_at=folder.created_at, conversation_count=count)


async def delete_folder(db: AsyncSession, user_id: uuid.UUID, folder_id: uuid.UUID) -> bool:
    result = await db.execute(select(Folder).where(Folder.user_id == user_id, Folder.id == folder_id))
    folder = result.scalar_one_or_none()
    if folder is None:
        return False
    await db.execute(update(Conversation).where(Conversation.folder_id == folder.id).values(folder_id=None))
    await db.delete(folder)
    await db.commit()
    return True
