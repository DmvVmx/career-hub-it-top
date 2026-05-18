from typing import Set

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user_from_token
from app.db.database import get_db
from app.models import User


router = APIRouter()


class PixelBattleConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, payload: dict):
        connections = self.active_connections.copy()

        for connection in connections:
            try:
                await connection.send_json(payload)
            except Exception:
                self.disconnect(connection)


pixel_battle_manager = PixelBattleConnectionManager()


@router.websocket("/ws/pixel-battle")
async def pixel_battle_websocket(
    websocket: WebSocket,
    db: AsyncSession = Depends(get_db),
):
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close(code=1008)
        return

    try:
        user: User = await get_current_user_from_token(token=token, db=db)
    except Exception:
        await websocket.close(code=1008)
        return

    await pixel_battle_manager.connect(websocket)

    try:
        await websocket.send_json(
            {
                "type": "connected",
                "message": "Pixel Battle WebSocket connected",
                "user_id": user.id,
            }
        )

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        pixel_battle_manager.disconnect(websocket)

    except Exception:
        pixel_battle_manager.disconnect(websocket)