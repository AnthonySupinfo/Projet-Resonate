const BASE_URL = (import.meta.env.VITE_API_BASE_URL) + "/api/v1";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
});

export const searchService = {
    async searchAlbums(query, limit = 20, page = 1) {
        const response = await fetch(`${BASE_URL}/search/albums?q=${encodeURIComponent(query)}&limit=${limit}&page=${page}`, {
            headers: authHeaders()
        });
        if (!response.ok) throw new Error("Erreur réseau lors de la recherche d'albums");
        return response.json();
    },

    async searchUsers(query) {
        const response = await fetch(`${BASE_URL}/search/users?q=${encodeURIComponent(query)}`, {
            headers: authHeaders()
        });
        if (!response.ok) throw new Error("Erreur réseau lors de la recherche d'utilisateurs");
        return response.json();
    },

    async searchLists(query, limit = 10, page = 1) {
        const response = await fetch(`${BASE_URL}/search/lists?q=${encodeURIComponent(query)}&limit=${limit}&page=${page}`
        );
        if (!response.ok) throw new Error("Erreur réseau lors de la recherche des listes");
        return response.json();
    }
};