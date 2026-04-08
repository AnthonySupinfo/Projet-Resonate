from pydantic import BaseModel
from datetime import datetime


class PlaylistCreate(BaseModel):
    name: str
    description: str | None = None  # accepte rien et par défaut : rien au début
    is_public: bool = False


class PlaylistResponse(PlaylistCreate):
    id: int
    user_id: str
    created_at: datetime


class PlaylistUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_public: bool | None = None


class PlaylistTackAdd(BaseModel):
    album_id: int

    # permet de convertir un objet SQLAlchemy directement
    model_config = {"from_attributes": True}
