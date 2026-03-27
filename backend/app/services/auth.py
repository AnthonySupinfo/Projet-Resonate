from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import RegisterRequest

# Hachage des mots de passe et création de tokens JWT
def hash_password(password: str) -> str:
    
    # bcrypt.hashpw() hache le mot de passe avec un sel aléatoire généré par bcrypt.gensalt()
    pwd_bytes = password.encode("utf-8")   
    salt = bcrypt.gensalt()                
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")  # retourne une string

def verify_password(plain: str, hashed: str) -> bool:
    # bcrypt.checkpw() vérifie que le mot de passe plain correspond au haché hashed
    return bcrypt.checkpw(
        plain.encode("utf-8"),
        hashed.encode("utf-8")
    )

# Création du token JWT
def create_access_token(user_id: str, role: str) -> str:
    # Le token JWT contient l'id utilisateur (sub), le rôle (role) et la date d'expiration (exp)
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire
    }
    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

# Inscription
async def register_user(data: RegisterRequest, db: AsyncSession) -> User:
    # Étape 1 - Email déjà utilisé ?
    result = await db.execute(
        select(User).where(User.email == data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé"
        )

    # Étape 2 - Username déjà utilisé ?
    result = await db.execute(
        select(User).where(User.username == data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce nom d'utilisateur est déjà pris"
        )

    # Étape 3 - Hash du mot de passe
    hashed = hash_password(data.password)

    # Étape 4 - Création en BDD
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hashed
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

# Connexion
async def login_user(email: str, password: str, db: AsyncSession) -> str:
    # Erreur générique pour email ou mot de passe incorrect, pour ne pas révéler si l'email existe ou pas
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email ou mot de passe incorrect",
        headers={"WWW-Authenticate": "Bearer"}
    )

    # Étape 1 - Cherche l'utilisateur
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

    # Étape 2 - Utilisateur inexistant ou mauvais mot de pass
    if not user or not verify_password(password, user.hashed_password):
        raise credentials_error

    # Étape 3 - Compte banni ?
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte a été désactivé"
        )

    # Étape 4 - Génère le token JWT
    return create_access_token(user.id, user.role)