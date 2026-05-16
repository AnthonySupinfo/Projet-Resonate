import enum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from app.db.session import Base

class NotificationType(str, enum.Enum):
    LIKE = "LIKE"
    COMMENT = "COMMENT"
    FOLLOW = "FOLLOW"
    SYSTEM_MSG = "SYSTEM_MSG"
    RECOMMANDATION = "RECOMMANDATION"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column (SQLEnum(NotificationType), nullable=False)
    message = Column(String, nullable=True)

    related_user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    related_review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=True)

    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())