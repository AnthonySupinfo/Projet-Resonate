const BASE_URL = (import.meta.env.VITE_API_BASE_URL) + "/api/v1";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
});

export const chatService = {
    async getConversations() {
        const response = await fetch(`${BASE_URL}/conversations/`, {
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
    },

    async getMutualFriends() {
        const response = await fetch(`${BASE_URL}/conversations/friends`, {
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des amis');
        return response.json();
    },

    async startConversation(userId) {
        const response = await fetch(`${BASE_URL}/conversations/chat/${userId}`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
    },

    async sendMessage(conversationId, content) {
        const response = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ content })
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
    },

    async getMessages(conversationId) {
        const response = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
    },

    async markConversationRead(conversationId) {
        const response = await fetch(`${BASE_URL}/conversations/${conversationId}/read`, {
            method: 'PATCH',
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return true;
    },

    async getUnreadCount() {
        const response = await fetch(`${BASE_URL}/conversations/unread-count`, {
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
    },

    async editMessage(messageId, content) {
        const response = await fetch(`${BASE_URL}/conversations/messages/${messageId}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ content })
        });
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
    }
};