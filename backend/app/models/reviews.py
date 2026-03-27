from sqlalchemy.sql import func
from sqlalchemy import Column, Text, Integer, ForeignKey, Boolean, CheckConstraint, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)

    album_id = Column(Integer, ForeignKey(
        "albums.id", ondelete="CASCADE"), nullable=False)

    rating = Column(Integer, CheckConstraint(
        'rating >= 0 and rating <= 5'), nullable=False)

    content = Column(Text, nullable=True)

    has_been_modified = Column(Boolean, nullable=False, server_default="false")

    posted_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    # contrainte unique grâce à variable args
    __table_args__ = (UniqueConstraint("user_id", "album_id",
                      name='unique review per person per album'))
