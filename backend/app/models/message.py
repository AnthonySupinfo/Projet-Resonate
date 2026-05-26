import enum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, CheckConstraint, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.sql import func
from app.db.session import Base

class MessageStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENDING = "SENDING"
    SENT = "SENT"
    INTERRUPTED = "INTERRUPTED"

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)

    user1_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user2_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint('user1_id <= user2_id', name='check_user1_less_than_user2'),
        UniqueConstraint('user1_id', 'user2_id', name='unique_conversation_users')
    )

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    content = Column(Text, nullable=False)
    status = Column(SQLEnum(MessageStatus), default=MessageStatus.PENDING, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    is_updated = Column(Boolean, default=False)