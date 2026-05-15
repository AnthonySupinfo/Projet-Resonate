from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class PlaylistCreate(BaseModel):
    name: str
    description: str | None = None  # accepte rien et par défaut : rien au début
    is_public: bool = False


class PlaylistResponse(BaseModel):
    id: int
    user_id: str
    type: str
    name: str
    description: str | None
    cover_url: str | None
    is_public: bool
    created_at: datetime


class PlaylistUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_public: bool | None = None


class PlaylistTrackAdd(BaseModel):
    album_id: UUID

    # permet de convertir un objet SQLAlchemy directement
    model_config = {"from_attributes": True}
