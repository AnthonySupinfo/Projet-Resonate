from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.services.message_service import message_service
from app.schemas.message import ConversationItemResponse, MessageResponse
from app.models.message import Message, Conversation

router = APIRouter(prefix="/conversations", tags=["Chat"])

@router.get("/unread-count")
async def get_unread_message_count(
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """Récupère le nom de messages non lus"""
    count = await message_service.get_unread_count(db, current_user["user_id"])
    return {"unread_count": count}

@router.get("/", response_model=List[ConversationItemResponse])
async def get_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Récupère les conversations du user connecté"""
    return await message_service.get_conversations(db, current_user["user_id"])

@router.post("/chat/{target_user_id}")
async def start_conversation(
    target_user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Crée ou récupère une conversation avec un user"""
    conversation = await message_service.get_or_create_conversation(db, current_user["user_id"], target_user_id)
    return {"conversation_id": conversation.id}

@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Récupère les messages d'une conversation"""
    conversation = await db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=403, detail="Accès refusé à cette conversation.")

    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()