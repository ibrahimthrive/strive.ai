from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.profile import ProfileOut


class UserSettingsOut(BaseModel):
    theme: str
    email_notifications_enabled: bool
    custom_instructions: str | None
    language: str
    updated_at: datetime


class UserSettingsUpdate(BaseModel):
    theme: str | None = Field(default=None, max_length=10)
    email_notifications_enabled: bool | None = None
    custom_instructions: str | None = Field(default=None, max_length=2000)
    language: str | None = Field(default=None, max_length=10)


class ExportedMessage(BaseModel):
    role: str
    content: str
    created_at: datetime


class ExportedConversation(BaseModel):
    title: str
    pinned: bool
    favorited: bool
    archived: bool
    created_at: datetime
    updated_at: datetime
    messages: list[ExportedMessage]


class ExportDataOut(BaseModel):
    profile: ProfileOut
    conversations: list[ExportedConversation]
