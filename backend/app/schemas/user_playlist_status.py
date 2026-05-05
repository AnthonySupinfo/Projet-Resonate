from pydantic import BaseModel
from datetime import datetime
from app.models.user_album_status import MediaStatus


class UserPlaylistStatusCreate(BaseModel):
    status: MediaStatus


class UserPlaylistStatusResponse(BaseModel):
    id: int
    user_id: str
    playlist_id: int
    status: MediaStatus
    updated_at: datetime

    model_config = {"from_attributes": True}
