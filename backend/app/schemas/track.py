
from pydantic import BaseModel
from uuid import UUID


class TrackResponse(BaseModel):
    id: UUID
    name: str
    artist: str | None = None
    album_name: str | None = None
    duration: int | None = None
    position: int | None = None

    model_config = {"from_attributes": True}
