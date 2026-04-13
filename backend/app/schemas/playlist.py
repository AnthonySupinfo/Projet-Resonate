from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class PlaylistCreate(BaseModel):
    name: str
    description: str | None = None  # accepte rien et par défaut : rien au début
    is_public: bool = False


class PlaylistResponse(PlaylistCreate):
    id: int
    user_id: UUID
    created_at: datetime
