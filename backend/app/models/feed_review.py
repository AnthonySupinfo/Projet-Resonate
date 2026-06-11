from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class FeedComment(Base):
    __tablename__ = "feed_comments"

    id = Column(Integer, primary_key=True, index=True)

    feed_id = Column(Integer, ForeignKey("user_activity_feed.id", ondelete="CASCADE"), nullable=False)

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    feed_item = relationship("UserActivityFeed", backref="comments")
    user = relationship("User")