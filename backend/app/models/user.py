import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class User(Base):
    # Nom de la table en BDD
    __tablename__ = "users"

    # Identifiant unique de l'utilisateur, généré automatiquement avec uuid4
    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # L'email est unique pour chaque utilisateur, utilisé pour la connexion
    email: Mapped[str] = mapped_column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    # Hash bcrypt du mot de passe de l'utilisateur
    hashed_password: Mapped[str] = mapped_column(
        String,
        nullable=True  # nullable=True car les utilisateurs OAuth n'ont pas de mot de passe
    )

    # Nom d'utilisateur unique, utilisé pour l'affichage et les mentions
    username: Mapped[str] = mapped_column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    # Rôle de l'utilisateur : "user" ou "admin", par défaut "user"
    role: Mapped[str] = mapped_column(
        String,
        default="user",
        nullable=False
    )

    # Compte actif ou banni par un admin
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    # Date de création de l'utilisateur, définie automatiquement à la création
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
