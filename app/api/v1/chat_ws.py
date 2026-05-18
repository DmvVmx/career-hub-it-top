from typing import Dict, Set

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user_from_token
from app.db.database import get_db
from app.models import User
from app.services.chat_service import create_chat_message, get_chat_for_user


router = APIRouter()


class ChatConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, chat_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(chat_id, set()).add(websocket)

    def disconnect(self, chat_id: int, websocket: WebSocket):
        connections = self.active_connections.get(chat_id)

        if not connections:
            return

        connections.discard(websocket)

        if not connections:
            self.active_connections.pop(chat_id, None)

    async def broadcast(self, chat_id: int, payload: dict):
        connections = self.active_connections.get(chat_id, set()).copy()

        for connection in connections:
            try:
                await connection.send_json(payload)
            except Exception:
                self.disconnect(chat_id, connection)


manager = ChatConnectionManager()


@router.websocket("/ws/chats/{chat_id}")
async def chat_websocket(
    websocket: WebSocket,
    chat_id: int,
    db: AsyncSession = Depends(get_db),
):
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close(code=1008)
        return

    try:
        user: User = await get_current_user_from_token(token=token, db=db)
        await get_chat_for_user(db=db, user=user, chat_id=chat_id)
    except Exception:
        await websocket.close(code=1008)
        return

    await manager.connect(chat_id, websocket)

    try:
        while True:
            try:
                data = await websocket.receive_json()
                text = str(data.get("text", "")).strip()

                if not text:
                    continue

                message = await create_chat_message(
                    db=db,
                    user=user,
                    chat_id=chat_id,
                    text=text,
                )

                await manager.broadcast(
                    chat_id,
                    {
                        "type": "message",
                        "message": {
                            "id": message.id,
                            "chat_id": message.chat_id,
                            "sender_user_id": message.sender_user_id,
                            "text": message.text,
                            "file_url": message.file_url,
                            "file_name": message.file_name,
                            "file_type": message.file_type,
                            "created_at": message.created_at.isoformat(),
                        },
                    },
                )

            except ValueError as e:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": str(e),
                    }
                )

            except Exception:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Не удалось отправить сообщение",
                    }
                )

    except WebSocketDisconnect:
        manager.disconnect(chat_id, websocket)