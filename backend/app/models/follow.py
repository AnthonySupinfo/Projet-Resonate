from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.session import Base

class Follow(Base):
    __tablename__ = "follows"
    follower_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    following_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())