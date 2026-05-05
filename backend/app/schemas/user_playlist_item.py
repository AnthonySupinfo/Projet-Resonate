from pydantic import BaseModel
from datetime import datetime


class PlaylistItemAdd(BaseModel):
    track_id: int


class PlaylistItemResponse(BaseModel):
    id: int
    playlist_id: int
    track_id: int
    added_at: datetime

    model_config = {"from_attributes": True}
