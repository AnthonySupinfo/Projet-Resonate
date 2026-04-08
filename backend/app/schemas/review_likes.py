from pydantic import BaseModel
from datetime import datetime


class ReviewLikeResponse(BaseModel):
    user_id: str
    review_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
