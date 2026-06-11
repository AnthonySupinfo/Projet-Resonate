from datetime import datetime, timedelta, timezone
from jose import jwt
import bcrypt
import secrets
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.core.config import settings
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.auth import RegisterRequest
from app.models.playlist import Playlist, PlaylistType

# hash_password


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

# verify_password


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(
        plain.encode("utf-8"),
        hashed.encode("utf-8")
    )

# create_access_token


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

# create_refresh_token (génère un token opaque stocké en BDD)


async def create_refresh_token(user_id: str, db: AsyncSession) -> str:
    token = secrets.token_hex(64)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_REFRESH_TOKEN_EXPIRE_MINUTES
    )
    refresh = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    db.add(refresh)
    await db.commit()
    return token

# rotate_refresh_token (vérifie l'ancien, le révoque, en crée un nouveau)


async def rotate_refresh_token(old_token: str, db: AsyncSession) -> dict:
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == old_token)
    )
    stored = result.scalar_one_or_none()

    if not stored or stored.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalide"
        )

    if stored.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        stored.revoked = True
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expiré"
        )

    user_result = await db.execute(
        select(User).where(User.id == stored.user_id)
    )
    user = user_result.scalar_one_or_none()

    if not user or not user.is_active:
        stored.revoked = True
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte a été désactivé"
        )

    stored.revoked = True

    new_access = create_access_token(user.id, user.role)
    new_refresh = await create_refresh_token(user.id, db)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "user_id": user.id,
        "role": user.role
    }

# revoke_all_refresh_tokens(déconnexion complète)


async def revoke_all_refresh_tokens(user_id: str, db: AsyncSession):
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False
        )
    )
    tokens = result.scalars().all()
    for t in tokens:
        t.revoked = True
    await db.commit()

# register_user


async def register_user(data: RegisterRequest, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé"
        )

    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce nom d'utilisateur est déjà pris"
        )

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        birth_date=data.birth_date,
        avatar_url=data.avatar_url,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    favorite_playlist = Playlist(
        user_id=user.id,
        name="Musiques favorites",
        type=PlaylistType.DEFAULT,
        is_public=False,
        is_favorite=True
    )

    db.add(favorite_playlist)
    await db.commit()

    return user

# login_user


async def login_user(email: str, password: str, db: AsyncSession) -> dict:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email ou mot de passe incorrect",
        headers={"WWW-Authenticate": "Bearer"}
    )

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        raise credentials_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte a été désactivé"
        )

    access_token = create_access_token(user.id, user.role)
    refresh_token = await create_refresh_token(user.id, db)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }
