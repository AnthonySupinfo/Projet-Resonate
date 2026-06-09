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


class AlbumInStatus(BaseModel):
    id: UUID
    name: str
    artist_name: str
    image: str | None = None
    image_url: str | None = None

    model_config = {"from_attributes": True}


class UserAlbumStatusWithAlbumResponse(BaseModel):
    id: int
    user_id: str
    album_id: UUID
    status: MediaStatus
    updated_at: datetime
    album: AlbumInStatus | None = None

    model_config = {"from_attributes": True}
