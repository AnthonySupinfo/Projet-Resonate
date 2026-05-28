import uuid
from datetime import datetime, date
from sqlalchemy import String, Boolean, DateTime, Date, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(
        String,
        unique=True,
        index=True,
        nullable=False
    )
    # NULL pour les comptes OAuth
    hashed_password: Mapped[str] = mapped_column(
        String,
        nullable=True
    )
    username: Mapped[str] = mapped_column(
        String,
        unique=True,
        index=True,
        nullable=False
    )
    role: Mapped[str] = mapped_column(String, default="user", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Infos personnelles
    first_name: Mapped[str] = mapped_column(String, nullable=True, default=None)
    last_name: Mapped[str] = mapped_column(String, nullable=True, default=None)
    birth_date: Mapped[date] = mapped_column(Date, nullable=True, default=None)

    # Profil
    avatar_url: Mapped[str] = mapped_column(String, nullable=True, default=None)
    bio: Mapped[str] = mapped_column(Text, nullable=True, default=None)
    website: Mapped[str] = mapped_column(String, nullable=True, default=None)
    theme: Mapped[str] = mapped_column(String, default="dark", nullable=False)

    # Following
    following: Mapped[list["User"]] = relationship(
        "User",
        secondary="follows",
        primaryjoin="User.id == Follow.follower_id",
        secondaryjoin="User.id == Follow.following_id",
        back_populates="followers"
    )

    followers: Mapped[list["User"]] = relationship(
        "User",
        secondary="follows",
        primaryjoin="User.id == Follow.following_id",
        secondaryjoin="User.id == Follow.follower_id",
        back_populates="following"
    )