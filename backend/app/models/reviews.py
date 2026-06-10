from sqlalchemy.sql import func
from sqlalchemy import Column, Text, Integer, ForeignKey, Boolean, CheckConstraint, DateTime, UniqueConstraint, String
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
from sqlalchemy.orm import relationship


class Review(Base):
    __tablename__ = "reviews"

    
    id = Column(Integer, primary_key=True, index=True)

    parent_id = Column(
        Integer,
        ForeignKey("reviews.id", ondelete="CASCADE"),
        nullable=True
    )

    replies = relationship(
        "Review",
        backref="parent",
        remote_side=[id],
        cascade="all, delete"
    )

    user_id = Column(String, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)

    album_id = Column(UUID(as_uuid=True), ForeignKey(
        "albums.id", ondelete="CASCADE"), nullable=False)

    rating = Column(
        Integer,
        CheckConstraint('rating >= 0 AND rating <= 5'),
        nullable=True  # IMPORTANT
    )

    content = Column(Text, nullable=True)

    has_been_modified = Column(Boolean, nullable=False, server_default="false")

    posted_at = Column(DateTime(timezone=True),
                       server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Coup de cœur admin
    is_featured = Column(Boolean, nullable=False, server_default="false")

    # contrainte unique grâce à variable args
    __table_args__ = (UniqueConstraint("user_id", "album_id",
                                       name='unique review per person per album'),)
