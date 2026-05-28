from pydantic import BaseModel

class UserStatsResponse(BaseModel):
    followers_count: int
    playlists_count: int
    listening_minutes: int
    liked_albums_count: int
    reviews_count: int
    comments_count: int

    class Config:
        from_attributes = True