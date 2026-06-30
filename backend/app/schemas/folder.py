import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class FolderOut(BaseModel):
    id: uuid.UUID
    name: str
    created_at: datetime
    conversation_count: int


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)


class FolderUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
