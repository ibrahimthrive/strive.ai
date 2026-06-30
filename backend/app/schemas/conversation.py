import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class ConversationView(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    PINNED = "pinned"
    FAVORITED = "favorited"


class ConversationSort(str, Enum):
    UPDATED_DESC = "updated_desc"
    UPDATED_ASC = "updated_asc"
    TITLE_ASC = "title_asc"
    CREATED_DESC = "created_desc"


class ConversationOut(BaseModel):
    client_id: str
    title: str
    pinned: bool
    favorited: bool
    archived: bool
    folder_id: uuid.UUID | None
    message_count: int
    created_at: datetime
    updated_at: datetime


class ConversationUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=120)
    pinned: bool | None = None
    favorited: bool | None = None
    archived: bool | None = None
    folder_id: uuid.UUID | None = None  # only applied if present in the body; see exclude_unset usage
