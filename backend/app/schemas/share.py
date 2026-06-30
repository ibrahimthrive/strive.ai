from datetime import datetime

from pydantic import BaseModel


class ShareLinkOut(BaseModel):
    share_token: str


class SharedMessageOut(BaseModel):
    role: str
    content: str
    created_at: datetime


class SharedConversationOut(BaseModel):
    title: str
    created_at: datetime
    messages: list[SharedMessageOut]
