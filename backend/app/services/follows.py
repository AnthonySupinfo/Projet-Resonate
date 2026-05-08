from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from fastapi import HTTPException, status
from app.models.user import User
from app.models.follow import Follow

class FollowService:
    async def follow_user(self, db: Session, follower_id: str, following_id: str):
        # Vérif auto-follow
        if follower_id == following_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous ne pouvez pas vous suivre vous-même."
            )

        # Vérif exitance user à suivre
        target_user = await db.get(User, following_id)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="L'utilisateur à suivre n'existe pas."
            )

        # Vérif si le user A suit déjà le user B
        existing_follow = await db.get(Follow, (follower_id, following_id))

        if existing_follow:
            return {"message": "Vous suivez déjà cet utilisateur."}


        # Insertion si tout est bon
        new_follow = Follow(follower_id=follower_id, following_id=following_id)
        db.add(new_follow)
        await db.commit()
        return {"message": f"Vous suivez désormais {target_user.username}."}


    async def unfollow_user(self, db: AsyncSession, follower_id: str, following_id: str):
        stmt = delete(Follow).where(
            Follow.follower_id == follower_id,
            Follow.following_id == following_id
        )

        result = await db.execute(stmt)
        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tu ne suis pas cet utilisateur."
            )

        await db.commit()
        return {"message": "Vous ne suivez maintenant plus cet utilisateur."}


follow_service = FollowService()