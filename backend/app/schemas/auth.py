import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import Tier


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    display_name: str | None = None
    tier: Tier


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
