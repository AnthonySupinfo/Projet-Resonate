const BASE_URL = (import.meta.env.VITE_API_BASE_URL) + "/api/v1";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
});

export const feedService = {
    async getFeed() {
        const response = await fetch(`${BASE_URL}/users/me/feed`, {
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();

        return data.map(item => ({
            id: item.id,
            type: item.activity_type,
            timeAgo: new Date(item.created_at).toLocaleDateString(),
            comments: item.comments || [],
            likesCount: item.likes_count || 0,
            userLiked: item.user_liked || false,
            user: {
                id: item.actor_id,
                name: item.actor_username,
                avatar: item.actor_avatar || item.actor_username?.charAt(0).toUpperCase() || '?'
            },
            target: {
                id: item.track_id || item.playlist_id || item.target_user_id || item.album_id,
                name: item.track_name || item.playlist_name || item.target_user_username || item.album_title || "Élément",
                artist: item.track_artist || item.album_artist || "",
                albumTitle: item.album_title || "",
                albumStatus: item.album_status || "PLANNED",
                duration: item.track_duration || 0,
                playlistId: item.playlist_id,
                playlistName: item.playlist_name,
                coverUrl: item.cover_url,
                trackCount: item.track_count || item.tracks_count || 0,
                username: item.target_user_username ? `@${item.target_user_username}` : "",
                avatarUrl: item.target_user_avatar || item.target_user_username?.charAt(0).toUpperCase() || '?',
                isFollowedByMe: item.target_user_is_followed_by_me || false
            },
            review: {
                id: item.review_id,
                rating: item.review_like_rating,
                content: item.review_comment_content
            }
        }));
    },

    async followUser(userId) {
        const response = await fetch(`${BASE_URL}/users/${userId}/follow`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
    },

    async unfollowUser(userId) {
        const response = await fetch(`${BASE_URL}/users/${userId}/follow`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return true;
    },

    async followPlaylist(playlistId) {
        const response = await fetch(`${BASE_URL}/playlists/${playlistId}/follow`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
    },

    async unfollowPlaylist(playlistId) {
        const response = await fetch(`${BASE_URL}/playlists/${playlistId}/follow`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return true;
    },

    async getFollowers(userId) {
        const response = await fetch(`${BASE_URL}/users/${userId}/followers`, {
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
    },

    async getFollowing(userId) {
        const response = await fetch(`${BASE_URL}/users/${userId}/following`, {
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
    },

    async createFeedComment(feedId, content) {
        const res = await fetch(`${BASE_URL}/users/feed/${feedId}/comments`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ content })
        });
        if (!res.ok) throw new Error("Erreur lors de l'ajout du commentaire");
        return res.json();
    },

    async deleteFeedComment(commentId) {
        const res = await fetch(`${BASE_URL}/users/feed/comments/${commentId}`, {
            method: "DELETE",
            headers: authHeaders()
        });
        if (!res.ok) throw new Error("Erreur lors de la suppression du commentaire");
        return true;
    },

    async likeFeedItem(feedId) {
        const res = await fetch(`${BASE_URL}/users/feed/${feedId}/like`, {
            method: "POST",
            headers: authHeaders()
        });
        if (!res.ok) throw new Error("Erreur lors de l'ajout du like");
        return res.json();
    },

    async unlikeFeedItem(feedId) {
        const res = await fetch(`${BASE_URL}/users/feed/${feedId}/like`, {
            method: "DELETE",
            headers: authHeaders()
        });
        if (!res.ok) throw new Error("Erreur lors de la suppression du like");
        return true;
    }
};