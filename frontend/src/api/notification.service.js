const BASE_URL = (import.meta.env.VITE_API_BASE_URL) + "/api/v1";

const getToken = () => localStorage.getItem("token")

const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
}) ;

export const notificationService = {
    async getNotifications() {
        const response = await fetch(`${BASE_URL}/notifications/`,
            { headers: authHeaders() });
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
    },

    async getUnreadCount() {
        const response = await fetch(`${BASE_URL}/notifications/unread-count`,
            { headers: authHeaders() });
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
    },

    async markAsRead(id) {
        const response = await fetch(`${BASE_URL}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return true
    },

    async markAllAsRead() {
        const response = await fetch(`${BASE_URL}/notifications/read-all`, {
            method: 'PATCH',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return true;
    }

};