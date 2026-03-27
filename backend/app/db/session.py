from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# Connexion à la BDD PostgreSQL asynchrone avec SQLAlchemy
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development"
)

# Création des sessions asynchrones
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base de données (à étendre dans models.py)
class Base(DeclarativeBase):
    pass

# Création de la session de base de données pour les routes
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session