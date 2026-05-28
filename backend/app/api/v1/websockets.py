from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.websocket_manager import manager

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio
from app.core.websocket_manager import manager
from app.core.dependencies import verify_ws_token

router = APIRouter(tags=["WebSockets"])
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Endpoint temps réel avec auth sécurisée via le premier message"""
    await websocket.accept()

    try:
        first_message = await asyncio.wait_for(websocket.receive_text(), timeout=3.0)
        data = json.loads(first_message)

        token = data.get("token")
        if not token:
            raise ValueError("Token manquant")
        token_data = verify_ws_token(token)
        user_id = token_data["user_id"]

    except WebSocketDisconnect:
        return


    except asyncio.TimeoutError:
        print("Connexion WS refusée : Timeout")
        await websocket.close(code=1008)
        return

    except Exception as e:
        print(f"Connexion WS refusée (Erreur) : {e}")
        await websocket.close(code=1008)
        return

    await manager.connect(user_id, websocket)

    try:
        while True:
            data = await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(user_id)