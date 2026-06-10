from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, List
from datetime import timezone
from uuid import UUID


class ReviewCreate(BaseModel):
    rating: int | None = None #Note facultative pour les réponses, obligatoire pour les reviews principales
    content: str | None = None
    parent_id: int | None = None

    @field_validator("rating")
    @classmethod
    def rating_must_be_valid(cls, v):
        if v is not None and not (0 <= v <= 5):
            raise ValueError("Le rating doit être entre 0 et 5")
        return v


class ReviewUpdate(BaseModel):
    rating: int | None = None
    content: str | None = None

    @field_validator("rating")
    @classmethod
    def rating_must_be_valid(cls, v):
        if v is not None and not (0 <= v <= 5):
            raise ValueError("Le rating doit être entre 0 et 5")
        return v


class ReviewResponse(ReviewCreate):

    id: int
    user_id: UUID
    album_id: UUID
    rating: int
    content: Optional[str]
    has_been_modified: bool
    posted_at: datetime
    updated_at: Optional[datetime]

    username: str
    avatar_url: Optional[str]

    likes_count: int
    user_liked: bool

    # Coup de cœur admin
    is_featured: bool = False

    replies: List[dict] = []
    comments: List[dict] = []

    class Config:
        orm_mode = True