from sqlalchemy import Column, String, DateTime, JSON # type de colonne SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID # pour des clés uniques universelles
from sqlalchemy.sql import func # pour des fonctions SQL
import uuid # pour générer des UUID

from app.db.session import Base # la classe de base pour les modèles SQLAlchemy


class AlbumSearchCache(Base): # ALbumSearchCache hérite de base : c'est modele ORM
    __tablename__ = "album_search_cache" # nom de la table dans la base de données

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) 

    query = Column(String, nullable=False, unique=True, index=True) 

    results = Column(JSON, nullable=False) 

    fetched_at = Column(DateTime(timezone=True), nullable=True) 

    created_at = Column(DateTime(timezone=True), server_default=func.now()) 