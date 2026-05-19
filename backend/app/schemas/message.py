from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from app.models.message import MessageStatus

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: str
    content: str
    status: MessageStatus
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationItemResponse(BaseModel):
    conversation_id: int

    other_user_id: str
    other_user_username: str
    other_user_avatar: Optional[str] = None

    last_message_content: Optional[str] = None
    last_message_date: Optional[datetime] = None
    last_message_is_read: Optional[bool] = None
    last_message_sender_id: Optional[str] = None