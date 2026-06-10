from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.db.session import Base


class AlbumSearchCache(Base):
    __tablename__ = "album_search_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) 

    query = Column(String, nullable=False, unique=True, index=True) 

    results = Column(JSON, nullable=False) 

    fetched_at = Column(DateTime(timezone=True), nullable=True) 

    created_at = Column(DateTime(timezone=True), server_default=func.now()) 