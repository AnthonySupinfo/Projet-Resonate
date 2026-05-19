from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, func
from app.models.message import Conversation, Message
from app.models.user import User

class MessageService:
    async def get_unread_count(self, db: AsyncSession, user_id: str) -> int:
        """Calcule le nombre de total de messages non lus"""
        stmt = (
            select(func.count(Message.id))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Message.is_read == False,
                Message.sender_id != user_id,
                or_(Conversation.user1_id == user_id, Conversation.user2_id == user_id)
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one()

    async def get_conversations(self, db: AsyncSession, user_id: str):
        """Récupère la liste des conversations"""
        stmt = select(Conversation).where(
            or_(Conversation.user1_id == user_id, Conversation.user2_id == user_id)
        )
        result = await db.execute(stmt)
        conversations = result.scalars().all()

        injected_conversations = []
        for conversation in conversations:
            other_user_id = conversation.user2_id if conversation.user1_id == user_id else conversation.user1_id
            other_user = await db.get(User, other_user_id)
            if not other_user:
                continue

            msg_stmt = (
                select(Message)
                .where(Message.conversation_id == conversation.id)
                .order_by(desc(Message.created_at))
                .limit(1)
            )
            msg_result = await db.execute(msg_stmt)
            last_message = msg_result.scalars().first()

            item = {
                "conversation_id": conversation.id,
                "other_user_id": other_user.id,
                "other_user_username": other_user.username,
                "other_user_avatar": other_user.avatar_url,
                "last_message_content": last_message.content if last_message else None,
                "last_message_date": last_message.created_at if last_message else None,
                "last_message_is_read": last_message.is_read if last_message else None,
                "last_message_sender_id": last_message.sender_id if last_message else None,
            }
            injected_conversations.append(item)

            def get_date_for_sorting(conversation_item):
                if conversation_item["last_message_date"] is not None:
                    return conversation_item["last_message_date"].timestamp()
                else:
                    return 0

            injected_conversations.sort(key=get_date_for_sorting, reverse=True)
            return injected_conversations

    async def get_or_create_conversation(self, db: AsyncSession, user_a_id: str, user_b_id: str) -> Conversation:
            """Trouve la conversation existante ou la créer"""
            u1_id, u2_id = sorted([user_a_id, user_b_id])

            stmt = select(Conversation).where(
                and_(Conversation.user1_id == u1_id, Conversation.user2_id == u2_id)
            )
            result = await db.execute(stmt)
            conversation = result.scalars().first()

            if not conversation:
                conversation = Conversation(user1_id=u1_id, user2_id=u2_id)
                db.add(conversation)
                await db.commit()
                await db.refresh(conversation)

            return conversation

message_service = MessageService()