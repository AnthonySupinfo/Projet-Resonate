from fastapi import APIRouter, Depends, status
from app.core.dependencies import get_current_user, require_admin

router = APIRouter()

# Route publique - pas besoin d'être connecté


@router.get("/albums/{album_id}")
async def get_album(album_id: str):
    return {"album": "...données de l'album"}

# Route protégée - doit être connecté


@router.post("/albums/{album_id}/review")
async def post_review(album_id: str, current_user=Depends(get_current_user)):
    # Si on arrive ici, le token est valide. current_user contient user_id et role.
    return {"message": f"Critique postée par {current_user['user_id']}"}

# Route admin - doit être admin


@router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, admin=Depends(require_admin)):
    return {"message": "Critique supprimée"}
    # Si on arrive ici, l'utilisateur est admin. require_admin a vérifié le rôle et renvoyé une 403 sinon.
