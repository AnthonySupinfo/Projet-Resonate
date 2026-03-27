from datetime import datetime, timedelta
from jose import JWTError, jwt          
from passlib.context import CryptContext 
from app.core.config import settings

# Hachage des mots de passe 
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    # Transforme "motdepasse123" en "$2b$12$eImiTXuWVxfM37uY4JANjQ..."
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    # Vérifie que "motdepasse123" correspond à "$2b$12$eImiTXuWVxfM37uY4JANjQ..."
    return pwd_context.verify(plain, hashed)

# Création du token JWT
def create_access_token(user_id: str, role: str) -> str:
    
    # jwt.encode() prend un payload et un secret, et génère un token infalsifiable
    expire = datetime.utcnow() + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),   
        "role": role,           
        "exp": expire           
    }
    # jwt.encode() signe le payload avec le secret -> infalsifiable
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)