from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.db import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardSummary
from app.services.analytics_service import get_dashboard_summary

settings = get_settings()

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardSummary:
    return await get_dashboard_summary(db, current_user, settings.free_tier_daily_message_limit)
