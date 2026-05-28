from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from app.db.session import Base
import enum


# définition pour les type de la playlist
class PlaylistType(enum.Enum):
    DEFAULT = "DEFAULT"
    CUSTOM = "CUSTOM"
    ORIGINAL = "ORIGINAL"

# Définition de la table


class Playlist(Base):
    __tablename__ = "playlists"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(String, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)

    type = Column(Enum(PlaylistType), nullable=False)

    name = Column(String(255), nullable=False)
    cover_url = Column(String(512), nullable=True)
    description = Column(Text, nullable=True)

    is_public = Column(Boolean, nullable=False, server_default="false")
    is_favorite = Column(Boolean, default=False, nullable=False)

    # func.now permet de demander à la BDD l'heure actuelle
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)
