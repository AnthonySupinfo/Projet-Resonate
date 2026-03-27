from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):

    # App
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"

    # Pydantic convertit automatiquement la string en liste Python
    # ex: "http://localhost:5173" -> "http://localhost:5173"
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return [self.FRONTEND_URL]

    # Base de données
    DATABASE_URL: str

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # OAuth2 
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    # Last.fm 
    LASTFM_API_KEY: str = ""
    LASTFM_API_SECRET: str = ""

    class Config:
        # Indique à Pydantic où trouver le fichier .env
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Ignore les variables d'env inconnues
        extra = "ignore"


settings = Settings()