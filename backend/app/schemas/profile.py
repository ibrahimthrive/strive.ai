import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user import Tier


class ProfileOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    display_name: str | None
    tier: Tier
    created_at: datetime


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=80)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class DeleteAccountRequest(BaseModel):
    password: str


class ApiKeyOut(BaseModel):
    id: uuid.UUID
    name: str
    key_prefix: str
    created_at: datetime
    revoked_at: datetime | None


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=60)


class ApiKeyCreateResponse(ApiKeyOut):
    api_key: str
