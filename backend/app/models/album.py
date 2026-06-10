from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from sqlalchemy.orm import relationship


from app.db.session import Base


class Album(Base):
    __tablename__ = "albums"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String, nullable=False)
    title = Column(String, nullable=True)

    artist_name = Column(String, nullable=False)

    lastfm_url = Column(String, unique=True, index=True)

    image = Column(String, nullable=True)

    fetched_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tracks = relationship("Track", back_populates="album")

    year = Column(Integer, nullable=True)
