from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.schemas.settings import ExportDataOut, UserSettingsOut, UserSettingsUpdate
from app.services import settings_service

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
async def get_settings(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> UserSettingsOut:
    settings = await settings_service.get_or_create_settings(db, current_user.id)
    return UserSettingsOut.model_validate(settings, from_attributes=True)


@router.patch("")
async def update_settings(
    payload: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserSettingsOut:
    settings = await settings_service.update_settings(db, current_user.id, payload)
    return UserSettingsOut.model_validate(settings, from_attributes=True)


@router.get("/export")
async def export_data(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> ExportDataOut:
    return await settings_service.export_user_data(db, current_user)
