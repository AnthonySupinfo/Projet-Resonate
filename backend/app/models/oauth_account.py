import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class OAuthAccount(Base):

    __tablename__ = "oauth_accounts"

    # Identifiant unique de la liaison
    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Lien vers l'utilisateur de notre base de données
    user_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # Le provider d'où viennent les infos (google, github, etc.)
    provider: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    # L'identifiant de l'utilisateur chez le provider (Google, GitHub, etc.)
    provider_user_id: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    # L'email de l'utilisateur chez le provider (utile pour les connexions futures)
    provider_email: Mapped[str] = mapped_column(
        String,
        nullable=False
    )