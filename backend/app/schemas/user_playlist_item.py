from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class PlaylistItemAdd(BaseModel):
    track_id: str
    artist: str | None = None


class PlaylistItemResponse(BaseModel):
    id: int
    playlist_id: int
    track_id: UUID
    artist: str | None = None
    added_at: datetime

    model_config = {"from_attributes": True}
