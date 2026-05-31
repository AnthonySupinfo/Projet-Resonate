import re
from datetime import date
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

# Schémas de requête et de réponse pour l'authentification
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[date] = None
    avatar_url: Optional[str] = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("Le nom d'utilisateur doit faire au moins 3 caractères")
        if len(value) > 20:
            raise ValueError("Le nom d'utilisateur ne peut pas dépasser 20 caractères")
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise ValueError("Uniquement lettres, chiffres et underscores autorisés")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 6:
            raise ValueError("Le mot de passe doit faire au moins 6 caractères")
        if len(re.findall(r'\d', value)) < 2:
            raise ValueError("Le mot de passe doit contenir au moins 2 chiffres")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`\'";:]', value):
            raise ValueError("Le mot de passe doit contenir au moins 1 caractère spécial")
        return value

# Schémas de requête
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Schémas de réponse
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str

    class Config:
        from_attributes = True

class UserProfileResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[date] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    theme: str = "dark"
    is_followed_by_me: bool = False

    class Config:
        from_attributes = True

class UpdateProfileRequest(BaseModel):
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    theme: Optional[str] = None

    @field_validator("theme")
    @classmethod
    def validate_theme(cls, value: str) -> str:
        if value and value not in ["dark", "light"]:
            raise ValueError("Le thème doit être 'dark' ou 'light'")
        return value

    @field_validator("website")
    @classmethod
    def validate_website(cls, value: str) -> str:
        if value and not value.startswith(("http://", "https://")):
            raise ValueError("Le site web doit commencer par http:// ou https://")
        return value