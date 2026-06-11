from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime, Enum, UniqueConstraint, String
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class ReportStatus(enum.Enum):
    PENDING = "PENDING"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    reporter_id = Column(String, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)

    # Signalement d'une review (nullable pour permettre le signalement d'un user)
    review_id = Column(Integer, ForeignKey(
        "reviews.id", ondelete="CASCADE"), nullable=True)

    # Signalement d'un utilisateur (nullable pour permettre le signalement d'une review)
    reported_user_id = Column(String, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=True)

    reason = Column(Text, nullable=False)
    status = Column(Enum(ReportStatus), nullable=False, server_default="PENDING")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reviewed_by_id = Column(String, ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)