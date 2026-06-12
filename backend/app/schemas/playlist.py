from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from app.models.playlist import PlaylistType
from typing import List
from app.schemas.track import TrackResponse


class PlaylistCreate(BaseModel):
    name: str
    description: str | None = None
    is_public: bool = False
    is_favorite: bool = False


class PlaylistResponse(BaseModel):
    id: int
    user_id: str
    username: str | None = None
    avatar_url: str | None = None
    type: PlaylistType
    name: str
    description: str | None
    cover_url: str | None
    is_public: bool
    is_favorite: bool
    created_at: datetime
    track_count: int = 0
    tracks: List[TrackResponse] = []

    model_config = {"from_attributes": True, "use_enum_values": True}


class PlaylistUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_public: bool | None = None
    is_favorite: bool | None = None


class PlaylistTrackAdd(BaseModel):
    album_id: UUID

    model_config = {"from_attributes": True}


class ToggleFavoriteTrack(BaseModel):
    track_name: str
    artist: str
