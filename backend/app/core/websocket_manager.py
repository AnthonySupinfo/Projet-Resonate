from typing import Dict

import websockets
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket : WebSocket):
        """Accepte la connexion et l'enregistre dans le dictionnaire."""
        self.active_connections[user_id] = websocket
        print(self.active_connections)

    async def disconnect(self, user_id: str):
        """Supprime la connexion du dictionnaire quand l'utilisateur se déconnecte."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_notification(self, message: dict, user_id: str):
        """Envoie un message JSON au format dictionnaire à un utilisateur spécifique s'il est en ligne."""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_json(message)

manager = ConnectionManager()