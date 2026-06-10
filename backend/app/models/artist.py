from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.db.session import Base





class Artist(Base):
    __tablename__ = "artists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) 

    name = Column(String, nullable=False, unique=True, index=True) 

    lastfm_url = Column(String, unique=True, index=True)

    fetched_at = Column(DateTime(timezone=True), nullable=True) 

    created_at = Column(DateTime(timezone=True), server_default=func.now()) 