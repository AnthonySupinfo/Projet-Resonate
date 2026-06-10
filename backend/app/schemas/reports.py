from pydantic import BaseModel
from app.models.reports import ReportStatus
from datetime import datetime


class ReportCreate(BaseModel):
    reason: str


class ReportResponse(BaseModel):
    id: int
    reporter_id: str
    reporter_username: str | None = None  # @username du signaleur
    review_id: int
    reason: str
    status: ReportStatus
    created_at: datetime
    reviewed_by_id: str | None = None
    resolved_at: datetime | None = None

    model_config = {"from_attributes": True}