from typing import Dict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        """Accepte la connexion et l'enregistre dans le dictionnaire."""
        self.active_connections[user_id] = websocket
        print(f"Nouvelle connexion. Actifs : {list(self.active_connections.keys())}")

    async def disconnect(self, user_id: str):
        """Supprime la connexion du dictionnaire quand l'utilisateur se déconnecte."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_notification(self, message: dict, user_id: str):
        """Envoie un message JSON à un utilisateur spécifique s'il est en ligne."""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            try:
                await websocket.send_json(message)
            except RuntimeError:
                print(f"Websocket de {user_id} déjà fermé inopinément. Nettoyage.")
                await self.disconnect(user_id)
            except Exception as e:
                print(f"Erreur d'envoi Websocket pour {user_id} : {e}")
                await self.disconnect(user_id)

manager = ConnectionManager()