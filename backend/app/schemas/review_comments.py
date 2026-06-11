from pydantic import BaseModel
from datetime import datetime


class ReviewCommentCreate(BaseModel):
    content: str


class ReviewCommentUpdate(BaseModel):
    content: str


class ReviewCommentResponse(ReviewCommentCreate):
    id: int
    review_id: int
    user_id: str
    has_been_modified: bool
    created_at: datetime
    updated_at: datetime
    username: str

    model_config = {"from_attributes": True}
