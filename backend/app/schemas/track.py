
from pydantic import BaseModel
from uuid import UUID

class TrackResponse(BaseModel):
    id: UUID
    name: str
    artist: str | None = None

    model_config = {"from_attributes": True}
