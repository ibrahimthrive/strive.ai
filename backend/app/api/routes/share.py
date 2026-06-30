from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.schemas.share import ShareLinkOut, SharedConversationOut, SharedMessageOut
from app.services import conversation_service

router = APIRouter(prefix="/api/conversations", tags=["share"])
public_router = APIRouter(prefix="/api/share", tags=["share"])


@router.post("/{client_id}/share")
async def create_share_link(
    client_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShareLinkOut:
    token = await conversation_service.enable_share(db, current_user.id, client_id)
    if token is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return ShareLinkOut(share_token=token)


@router.delete("/{client_id}/share", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_share_link(
    client_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    disabled = await conversation_service.disable_share(db, current_user.id, client_id)
    if not disabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")


@public_router.get("/{token}")
async def get_shared_conversation(token: str, db: AsyncSession = Depends(get_db)) -> SharedConversationOut:
    conversation = await conversation_service.get_shared_conversation(db, token)
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared conversation not found")
    messages = await conversation_service.list_messages_for_conversation(db, conversation.id)
    return SharedConversationOut(
        title=conversation.title,
        created_at=conversation.created_at,
        messages=[
            SharedMessageOut(role=message.role.value, content=message.content, created_at=message.created_at)
            for message in messages
        ],
    )
