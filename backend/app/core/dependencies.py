from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings

# Schéma de sécurité
#oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)

# get_current_user
async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    
    # Middleware d'authentification - vérifie que le token JWT est valide.
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"}
    )

    # Pas de token -> 401
    if token is None:
        raise credentials_error

    try:
        # Décodage du token
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )

        # Récupère l'id utilisateur du payload
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_error

        role: str = payload.get("role", "user")

    except JWTError:
        # Token malformé, signature incorrecte ou expiré
        raise credentials_error

    # Si tout est bon, on renvoie un dict avec les infos de l'utilisateur
    return {"user_id": user_id, "role": role}


# require_admin
async def require_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    # Middleware d'autorisation - vérifie que l'utilisateur est admin.
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    return current_user


# get_optional_user
async def get_optional_user(
    token: str = Depends(oauth2_scheme)
) -> dict | None:
    # Variante de get_current_user ne renvoie pas d'erreur si pas de token ou token invalide.
    if token is None:
        return None

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return {"user_id": user_id, "role": payload.get("role", "user")}

    except JWTError:
        # Token invalide -> on renvoie None sans planter
        return None