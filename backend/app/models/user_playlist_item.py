from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum, UniqueConstraint
from sqlalchemy.sql import func
from app.db.session import Base
from sqlalchemy.dialects.postgresql import UUID
import enum


class UserPlaylistItem(Base):
    __tablename__ = "user_playlist_items"

    id = Column(Integer, primary_key=True, index=True)

    playlist_id = Column(Integer, ForeignKey(
        "playlists.id", ondelete="CASCADE"), nullable=False)

    track_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tracks.id", ondelete="CASCADE"),
        nullable=False
    )


    added_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint(
        "playlist_id", "track_id", name="unique_track_per_playlist"),)
