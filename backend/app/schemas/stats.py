from pydantic import BaseModel

class UserStatsResponse(BaseModel):
    followers_count: int
    playlists_count: int
    listening_minutes: int
    liked_albums_count: int
    in_progress_albums_count: int = 0
    reviews_count: int
    comments_count: int

    class Config:
        from_attributes = True