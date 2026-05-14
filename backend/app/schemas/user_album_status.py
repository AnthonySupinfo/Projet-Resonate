from pydantic import BaseModel
from datetime import datetime
from app.models.user_album_status import MediaStatus
from uuid import UUID


class UserAlbumStatusCreate(BaseModel):
    status: MediaStatus


class UserAlbumStatusResponse(BaseModel):
    id: int
    user_id: str
    album_id: UUID
    status: MediaStatus
    updated_at: datetime

    model_config = {"from_attributes": True}
