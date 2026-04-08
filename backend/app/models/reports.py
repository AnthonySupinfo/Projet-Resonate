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

    review_id = Column(Integer, ForeignKey(
        "reviews.id", ondelete="CASCADE"), nullable=False)

    reason = Column(Text, nullable=False)

    status = Column(Enum(ReportStatus), nullable=False,
                    server_default="PENDING")

    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    reviewed_by_id = Column(String, ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True)

    resolved_at = Column(DateTime, nullable=True)
