import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.schemas.profile import (
    ApiKeyCreateRequest,
    ApiKeyCreateResponse,
    ApiKeyOut,
    ChangePasswordRequest,
    DeleteAccountRequest,
    ProfileOut,
    ProfileUpdate,
)
from app.services import profile_service
from app.services.profile_service import InvalidPasswordError

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("")
async def get_profile(current_user: User = Depends(get_current_user)) -> ProfileOut:
    return ProfileOut.model_validate(current_user, from_attributes=True)


@router.patch("")
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileOut:
    updated = await profile_service.update_display_name(db, current_user, payload.display_name)
    return ProfileOut.model_validate(updated, from_attributes=True)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await profile_service.change_password(db, current_user, payload.current_password, payload.new_password)
    except InvalidPasswordError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/api-keys")
async def list_api_keys(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[ApiKeyOut]:
    keys = await profile_service.list_api_keys(db, current_user.id)
    return [ApiKeyOut.model_validate(key, from_attributes=True) for key in keys]


@router.post("/api-keys", status_code=status.HTTP_201_CREATED)
async def create_api_key(
    payload: ApiKeyCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiKeyCreateResponse:
    api_key, raw_key = await profile_service.create_api_key(db, current_user.id, payload.name)
    return ApiKeyCreateResponse(**ApiKeyOut.model_validate(api_key, from_attributes=True).model_dump(), api_key=raw_key)


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    revoked = await profile_service.revoke_api_key(db, current_user.id, key_id)
    if not revoked:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    payload: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await profile_service.delete_account(db, current_user, payload.password)
    except InvalidPasswordError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
