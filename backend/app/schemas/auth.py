import re
from pydantic import BaseModel, EmailStr, field_validator

class RegisterRequest(BaseModel):

    email: EmailStr
    # EmailStr est un type spécial de Pydantic qui valide automatiquement que c'est une adresse email valide
    username: str
    # Nom d'utilisateur affiché sur le profil

    password: str
    # Mot de passe en clair, qui sera validé et hashé avant d'être stocké en base de données
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        # Validation des règles de nom d'utilisateur : 3-20 caractères, uniquement lettres, chiffres et underscores
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
        # Validation des règles de mot de passe : minimum 8 caractères, au moins 1 chiffre
        if len(value) < 8:
            raise ValueError("Le mot de passe doit faire au moins 8 caractères")
        if not re.search(r'\d', value):
            raise ValueError("Le mot de passe doit contenir au moins 1 chiffre")
        return value


class LoginRequest(BaseModel):
    # Les mêmes champs que RegisterRequest mais sans validation, car on veut juste vérifier que l'email et le mot de passe sont présents.
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    # Le token JWT que le frontend doit stocker pour les requêtes authentifiées
    access_token: str
    # Le type de token, toujours "bearer" pour les tokens d'accès OAuth2
    token_type: str = "bearer"
    


class UserResponse(BaseModel):
    # Les informations de l'utilisateur à renvoyer après l'inscription ou pour le profil, sans le mot de passe
    id: str
    email: str
    username: str
    role: str

    class Config:
        from_attributes = True
        # Permet de convertir un objet SQLAlchemy (User) en JSON automatiquement