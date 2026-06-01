from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.sql import func
from app.db.session import Base


class ReviewLike(Base):
    __tablename__ = "review_likes"

    user_id = Column(String, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, primary_key=True)

    review_id = Column(Integer, ForeignKey(
        "reviews.id", ondelete="CASCADE"), nullable=False, primary_key=True)

    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
