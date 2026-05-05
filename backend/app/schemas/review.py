from pydantic import BaseModel, field_validator
from datetime import datetime


class ReviewCreate(BaseModel):
    rating: int
    content: str | None = None

    @field_validator("rating")
    @classmethod
    def rating_must_be_valid(cls, v):
        if not 0 <= v <= 5:
            raise ValueError("Le rating doit être entre 0 et 5")
        return v


class ReviewUpdate(BaseModel):
    rating: int | None = None
    content: str | None = None

    @field_validator("rating")
    @classmethod
    def rating_must_be_valid(cls, v):
        if v is not None and not 0 <= v <= 5:
            raise ValueError("Le rating doit être entre 0 et 5")
        return v


class ReviewResponse(ReviewCreate):
    id: int
    user_id: str
    album_id: int
    has_been_modified: bool
    posted_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
