from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.services.message import message_service
from app.schemas.message import ConversationItemResponse, MessageResponse
from app.models.message import Message, Conversation
from app.schemas.message import MessageCreate
from app.schemas.message import MessageUpdate

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

@router.post("/{conversation_id}/messages", response_model=MessageResponse, status_code=201)
async def send_message(
        conversation_id: int,
        body: MessageCreate,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """Envoie une message dans une conversation et la distribue en temps réel"""
    try:
        new_msg = await message_service.send_message(
            db=db,
            conversation_id=conversation_id,
            sender_id=current_user["user_id"],
            content=body.content
        )
        await db.commit()
        await db.refresh(new_msg)
        return new_msg

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{conversation_id}/read", status_code=204)
async def mark_conversation_read(
        conversation_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """Marque la conversation comme lue."""
    try:
        await message_service.mark_conversation_as_read(db, conversation_id, current_user["user_id"])
        await db.commit()
        return None

    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.patch("/messages/{message_id}", response_model=MessageResponse)
async def update_message(
        message_id: int,
        body: MessageUpdate,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """Modifie un message."""
    try:
        updated_msg = await message_service.edit_message(
            db=db,
            message_id=message_id,
            sender_id=current_user["user_id"],
            new_content=body.content
        )
        await db.commit()
        await db.refresh(updated_msg)
        return updated_msg

    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))