from datetime import datetime

from pydantic import BaseModel


class ConversationSummary(BaseModel):
    client_id: str
    title: str
    pinned: bool
    message_count: int
    updated_at: datetime


class SeriesPoint(BaseModel):
    label: str
    value: int


class ActivityItem(BaseModel):
    conversation_title: str
    preview: str
    created_at: datetime


class UsageStat(BaseModel):
    today: int
    week: int
    month: int
    total: int


class DashboardSummary(BaseModel):
    messages_sent: UsageStat
    ai_requests: UsageStat
    tokens_used: UsageStat
    avg_response_ms: int | None
    storage_bytes: int
    files_uploaded: int
    remaining_uploads: int | None
    recent_conversations: list[ConversationSummary]
    weekly_series: list[SeriesPoint]
    monthly_series: list[SeriesPoint]
    activity: list[ActivityItem]
