from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, func, update
from app.models.message import Conversation, Message, MessageStatus
from app.models.user import User
from app.models.follow import Follow

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
        user_id_str = str(user_id)

        stmt = select(Conversation).where(
            or_(Conversation.user1_id == user_id, Conversation.user2_id == user_id)
        )
        result = await db.execute(stmt)
        conversations = result.scalars().all()

        injected_conversations = []
        for conversation in conversations:
            if str(conversation.user1_id) == user_id_str:
                other_user_id = str(conversation.user2_id)
            else:
                other_user_id = str(conversation.user1_id)

            other_user = await db.get(User, other_user_id)

            if not other_user:
                print(f"⚠️ BUG : Utilisateur {other_user_id} introuvable pour la conv {conversation.id}")
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
            is_mutual = await self.check_mutual_follow(db, user_a_id, user_b_id)
            if not is_mutual:
                raise ValueError("Vous devez vous suivre mutuellement pour démarrer une conversation.")

            u1_id, u2_id = sorted([str(user_a_id), str(user_b_id)])

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

    async def send_message(self, db: AsyncSession, conversation_id: int, sender_id: str, content: str) -> Message:
        """Envoie d'un message + envoie en temps réel"""
        conversation = await db.get(Conversation, conversation_id)
        if not conversation:
            raise ValueError("Conversation introuvable.")

        if conversation.user1_id != sender_id and conversation.user2_id != sender_id:
            raise ValueError("Vous ne faites pas partie de cette conversation.")

        target_user_id = conversation.user2_id if conversation.user1_id == sender_id else conversation.user1_id

        new_message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
            status=MessageStatus.PENDING
        )
        db.add(new_message)
        await db.flush()

        # json pour le temps réel :
        ws_payload = {
            "type": "new_message",
            "conversation_id": conversation_id,
            "message": {
                "id": new_message.id,
                "sender_id": sender_id,
                "content": content,
                "created_at": new_message.created_at.isoformat() if new_message.created_at else None
            },
            "unread_messages_count": await self.get_unread_count(db, target_user_id)
        }

        from app.core.websocket_manager import manager
        await manager.send_personal_notification(ws_payload, target_user_id)

        new_message.status = MessageStatus.SENT

        return new_message

    async def check_mutual_follow(self, db: AsyncSession, user_a_id: str, user_b_id: str) -> bool:
        """Vérifie si les deux utilisateurs se suivent."""
        stmt = (
            select(func.count())
            .select_from(Follow)
            .where(
                or_(
                    and_(Follow.follower_id == user_a_id, Follow.following_id == user_b_id),
                    and_(Follow.follower_id == user_b_id, Follow.following_id == user_a_id)
                )
            )
        )
        result = await db.execute(stmt)
        count = result.scalar_one()

        return count == 2

    async def mark_conversation_as_read(self, db: AsyncSession, conversation_id: int, user_id: str):
        """Marque tous les messages reçus dans une conversation comme lus."""

        conversation = await db.get(Conversation, conversation_id)
        if not conversation or (conversation.user1_id != user_id and conversation.user2_id != user_id):
            raise ValueError("Vous n'avez pas accès à cette conversation.")

        stmt = (
            update(Message)
            .where(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,
                Message.is_read == False
            )
            .values(is_read=True)
        )

        other_user_id = conversation.user2_id if conversation.user1_id == user_id else conversation.user1_id

        ws_payload = {
            "type": "conversation_read",
            "conversation_id": conversation_id
        }

        await db.execute(stmt)

        from app.core.websocket_manager import manager
        await manager.send_personal_notification(ws_payload, other_user_id)


    async def edit_message(self, db: AsyncSession, message_id: int, sender_id: str, new_content: str) -> Message:
        """Modifie un message existant et prévient le destinataire en temps réel."""
        message = await db.get(Message, message_id)
        if not message:
            raise ValueError("Message introuvable.")

        if message.sender_id != sender_id:
            raise ValueError("Vous ne pouvez modifier que vos propres messages.")

        message.content = new_content
        message.is_updated = True
        await db.flush()

        conversation = await db.get(Conversation, message.conversation_id)
        target_user_id = conversation.user2_id if conversation.user1_id == sender_id else conversation.user1_id

        ws_payload = {
            "type": "message_edited",
            "message_id": message.id,
            "new_content": new_content,
            "is_updated": True
        }

        from app.core.websocket_manager import manager
        await manager.send_personal_notification(ws_payload, target_user_id)

        return message

message_service = MessageService()