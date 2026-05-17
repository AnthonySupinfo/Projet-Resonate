from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.notification import NotificationType

class NotificationResponse(BaseModel):
    id: int
    type: NotificationType
    is_read: bool
    created_at: datetime
    message: Optional[str] = None

    related_user_id: Optional[str] = None
    related_user_username: Optional[str] = None
    related_user_avatar: Optional[str] = None

    related_review_id: Optional[int] = None

    class Config:
        from_attributes = True