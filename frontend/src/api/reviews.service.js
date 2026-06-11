const BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL) + "/api/v1";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
});

export const reviewsService = {
    async likeReview(reviewId) {
        const response = await fetch(`${BASE_URL}/reviews/${reviewId}/like`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de l'ajout du like");
        return response.json();
    },

    async unlikeReview(reviewId) {
        const response = await fetch(`${BASE_URL}/reviews/${reviewId}/like`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression du like");
        return true;
    },

    async deleteReview(reviewId) {
        const response = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression de la critique");
        return true;
    },

    async reportReview(reviewId, reason) {
        const response = await fetch(`${BASE_URL}/reviews/${reviewId}/report`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ reason })
        });
        if (!response.ok) throw new Error("Erreur lors du signalement");
        return response.json();
    },

    async updateReview(reviewId, data) {
        const response = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Erreur lors de la mise à jour");
        return response.json();
    },

    async createCommentReview(reviewId, content) {
        const response = await fetch(`${BASE_URL}/reviews/${reviewId}/comment`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ content })
        });
        if (!response.ok) throw new Error("Erreur lors de l'ajout du commentaire");
        return response.json();
    },

    async deleteCommentReview(commentId) {
        const response = await fetch(`${BASE_URL}/comments/${commentId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression du commentaire");
        return true;
    },

    async toggleFeature(reviewId, action) {
        const response = await fetch(`${BASE_URL}/admin/reviews/${reviewId}/${action}`, {
            method: 'PATCH',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la mise en avant");
        return response.json();
    }
};