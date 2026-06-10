import enum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.db.session import Base


class ActivityTypes(str, enum.Enum):
    LIKE_TRACK = "LIKE_TRACK"
    UPDATE_ALBUM_STATUS = "UPDATE_ALBUM_STATUS"
    FOLLOW_PLAYLIST = "FOLLOW_PLAYLIST"
    FOLLOW_USER = "FOLLOW_USER"
    CREATE_PLAYLIST = "CREATE_PLAYLIST"
    ADD_TRACK_PLAYLIST = "ADD_TRACK_PLAYLIST"
    REVIEW_ALBUM = "REVIEW_ALBUM"
    LIKE_REVIEW = "LIKE_REVIEW"
    COMMENT_REVIEW = "COMMENT_REVIEW"


class UserActivityFeed(Base):
    __tablename__ = "user_activity_feed"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    activity_type = Column(SQLEnum(ActivityTypes), nullable=False)

    target_user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=True)
    playlist_id = Column(Integer, ForeignKey("playlists.id", ondelete="CASCADE"), nullable=True)
    album_id = Column(UUID(as_uuid=True), ForeignKey("albums.id", ondelete="CASCADE"), nullable=True)
    track_id = Column(UUID(as_uuid=True), ForeignKey("tracks.id", ondelete="CASCADE"), nullable=True)


    created_at = Column(DateTime(timezone=True), server_default=func.now())