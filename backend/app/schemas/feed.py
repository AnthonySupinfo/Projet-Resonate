from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.user_activity_feed import ActivityTypes

class FeedItemResponse(BaseModel):
    id: int
    activity_type: ActivityTypes
    created_at: datetime

    # actor = user qui fait une action, déclenchant un post
    actor_id: str
    actor_username: str
    actor_avatar: Optional[str] = None

    target_user_id: Optional[str] = None
    target_user_username: Optional[str] = None

    playlist_id: Optional[int] = None
    playlist_name: Optional[str] = None

    album_id: Optional[int] = None
    album_title: Optional[str] = None

    # track_id: Optional[int] = None # TODO: à décommenter quand Krishna aura fait les tracks
    # track_title: Optional[str] = None TODO: à décommenter quand Krishna aura faire les tracks

    cover_url: Optional[str] = None

    review_id: Optional[int] = None
    review_comment_content: Optional[str] = None
    review_like_rating: Optional[int] = None

    # rajouter les autres infos à afficher ici si il y en a besoin d'autres

    class Config:
        from_attributes = True