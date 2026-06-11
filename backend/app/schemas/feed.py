from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from app.models.user_activity_feed import ActivityTypes


class FeedCommentResponse(BaseModel):
    id: int
    feed_id: int
    user_id: str
    content: str
    created_at: datetime

    username: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class FeedItemResponse(BaseModel):
    id: int
    activity_type: ActivityTypes
    created_at: datetime

    actor_id: str
    actor_username: str
    actor_avatar: Optional[str] = None

    target_user_id: Optional[str] = None
    target_user_username: Optional[str] = None
    target_user_avatar: Optional[str] = None
    target_user_is_followed_by_me: bool = False

    playlist_id: Optional[int] = None
    playlist_name: Optional[str] = None

    album_id: Optional[UUID] = None
    album_title: Optional[str] = None
    album_artist: Optional[str] = None
    album_status: Optional[str] = None

    track_count: Optional[int] = 0

    track_id: Optional[UUID] = None
    track_name: Optional[str] = None
    track_artist: Optional[str] = None
    track_duration: Optional[int] = None

    cover_url: Optional[str] = None

    review_id: Optional[int] = None
    review_comment_content: Optional[str] = None
    review_like_rating: Optional[int] = None

    comments: List[FeedCommentResponse] = []

    class Config:
        from_attributes = True