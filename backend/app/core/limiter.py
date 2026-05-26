from slowapi import Limiter
from slowapi.util import get_remote_address

# Identifie chaque client par son adresse IP
limiter = Limiter(key_func=get_remote_address)
