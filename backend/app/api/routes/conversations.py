import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.schemas.conversation import ConversationOut, ConversationSort, ConversationUpdate, ConversationView
from app.services import conversation_service

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("")
async def list_conversations(
    folder_id: uuid.UUID | None = None,
    view: ConversationView = ConversationView.ACTIVE,
    q: str | None = Query(default=None, max_length=200),
    sort: ConversationSort = ConversationSort.UPDATED_DESC,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ConversationOut]:
    return await conversation_service.list_conversations(
        db, current_user.id, folder_id=folder_id, view=view, q=q, sort=sort
    )


@router.patch("/{client_id}")
async def update_conversation(
    client_id: str,
    patch: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationOut:
    return await conversation_service.update_conversation(db, current_user.id, client_id, patch)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    client_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await conversation_service.delete_conversation(db, current_user.id, client_id)
