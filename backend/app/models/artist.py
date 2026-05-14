from sqlalchemy import Column, String, DateTime # type de colonne SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID # pour des clés uniques universelles
from sqlalchemy.sql import func # pour des fonctions SQL
import uuid # pour générer des UUID

from app.db.session import Base # la classe de base pour les modèles SQLAlchemy





class Artist(Base): # Artist hérite de Base : c'est un modèle ORM qui représente 
    # la table "artists" dans la base de données
    __tablename__ = "artists" # nom de la table dans la base de données

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) 

    name = Column(String, nullable=False, unique=True, index=True) 

    lastfm_url = Column(String, unique=True, index=True) # URL unique de l'artiste 
    # sur Last.fm, unique=True pour éviter les doublons,

    fetched_at = Column(DateTime(timezone=True), nullable=True) 

    created_at = Column(DateTime(timezone=True), server_default=func.now()) 