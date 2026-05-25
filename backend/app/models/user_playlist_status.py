from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum, UniqueConstraint, String
from sqlalchemy.sql import func
from app.db.session import Base
from sqlalchemy.dialects.postgresql import UUID
import enum


class MediaStatus(enum.Enum):
    PLANNED = "PLANNED"
    LISTENING = "LISTENING"
    COMPLETED = "COMPLETED"
    DROPPED = "DROPPED"


class UserPlaylistStatus(Base):
    __tablename__ = "user_playlist_status"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(String, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)

    playlist_id = Column(Integer, ForeignKey(
        "playlists.id", ondelete="CASCADE"), nullable=False)

    status = Column(Enum(MediaStatus), nullable=False)

    updated_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "playlist_id",
                      name="unique_status_per_user_per_playlist"),)
