from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from sqlalchemy.orm import relationship

from app.db.session import Base

class Track(Base):
    __tablename__ = "tracks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) # id 
    # UUID unique de la track, clé primaire, généré automatiquement si non fourni

    album_id = Column( 
        UUID(as_uuid=True),
        ForeignKey("albums.id", ondelete="CASCADE"), # ondelete="CASCADE" pour 
        # supprimer les tracks associées si l'album est supprimé
        nullable=False
    )

    name = Column(String, nullable=False) 

    position = Column(Integer, nullable=True) 

    duration = Column(Integer, nullable=True) 

    created_at = Column(DateTime(timezone=True), server_default=func.now()) 

    album = relationship("Album", back_populates="tracks")