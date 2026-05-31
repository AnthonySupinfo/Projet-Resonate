from sqlalchemy import Column, Integer, Boolean, Text, ForeignKey, DateTime, String
from sqlalchemy.sql import func
from app.db.session import Base


class ReviewComment(Base):
    __tablename__ = "review_comments"

    id = Column(Integer, primary_key=True, index=True)

    review_id = Column(Integer, ForeignKey(
        "reviews.id", ondelete="CASCADE"), nullable=False)

    user_id = Column(String, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)

    content = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    has_been_modified = Column(
        Boolean, server_default="false", nullable=False,)
    updated_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
