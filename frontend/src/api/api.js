const BASE_URL = (import.meta.env.VITE_API_BASE_URL) + "/api/v1"; // ajout pour ne pas avoir à réécrire

const getToken = () => localStorage.getItem("token")

const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
}) ;

// Bibliothèque 

export const getMyLibrary = async (status = null) => {
    const url = status
        ? `${BASE_URL}/users/me/library?status=${status}`
        : `${BASE_URL}/users/me/library`
    const res = await fetch(url, { headers: authHeaders() })
    if (!res.ok) throw new Error ("Erreur lors du chargement de la bibliothèque")
    return res.json()
}

export const upsertAlbumStatus = async (albumId, status) => {
    const res = await fetch(`${BASE_URL}/albums/${albumId}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status })
    })
    if(!res.ok) throw new Error ("Erreur lors de la mise à jour du status")
    return res.json()
}

export const deleteALbumStatus = async (albumId) => {
    const res = await fetch(`${BASE_URL}/albums/${albumId}/status`, {
        method: "DELETE",
        headers: authHeaders(),
    })
    if(!res.ok) throw new Error ("Erreur lors de la suppression du status")
}

export const getUserLibrary = async (userId) => {
    const res = await fetch(`${BASE_URL}/users/${userId}/library`, { headers: authHeaders() })
    if (!res.ok) throw new Error ("Erreur lors du chargement de la bibliothèque utilisateur")
    return res.json()
}

// Playlist 

export const getMyPlaylist = async () => {
    const res = await fetch (`${BASE_URL}/playlists/me`, { headers: authHeaders() })
    if(!res.ok) throw new Error ("Erreur lors du chargement de la playlist")
    return res.json()
}

export const getPlaylist = async (playlistId) => {
    const token = getToken();
    const headers = token
        ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" };
    const res = await fetch (`${BASE_URL}/playlists/${playlistId}`, { headers })
    if(!res.ok) throw new Error ("Erreur lors du chargement de la playlist, playlist introuvable")
    return res.json()
}

export const createPlaylist = async ({ name, description, is_public }) => {
    const res = await fetch(`${BASE_URL}/playlists/`, {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({ name, description, is_public })
    })
    if(!res.ok) throw new Error ("Erreur lors de la création de la playlist")
    return res.json()
}

export const updatePlaylist = async (playlistId, data) => {
    const res = await fetch(`${BASE_URL}/playlists/${playlistId}`, { 
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(data)
    })
    if(!res.ok) throw new Error ("Erreur lors de la création de la playlist")
    return res.json()  
}

export const deletePlaylist = async (playlistId) => {
    const res = await fetch(`${BASE_URL}/playlists/${playlistId}`, {
        method: "DELETE",
        headers: authHeaders(),
    })
    if(!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorMessage = errorData?.detail || "Erreur inconnue côté serveur";
        throw new Error(errorMessage);
    }
}

export const removeTrackFromPlaylist = async (playlistId, trackId) => {
    const res = await fetch(`${BASE_URL}/playlists/${playlistId}/tracks/${trackId}`, {
        method: "DELETE",
        headers: authHeaders(),
    })
    if(!res.ok) throw new Error ("Erreur lors de la suppression de la track de la playlist")
}

export const addTrackToPlaylist = async (playlistId, trackData) => {
    const res = await fetch(`${BASE_URL}/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify( trackData )
    })
    if(!res.ok) {
        const err = await res.text();
        console.error("Détail de l'erreur d'ajout à la playlist :", err);
        throw new Error ("Erreur lors de l'ajout à la playlist")
    } 
    return res.json()
}

export const getUserPlaylists = async (userId) => {
    const res = await fetch(`${BASE_URL}/playlists/user/${userId}`, { headers: authHeaders() })
    if (!res.ok) throw new Error ("Erreur lors du chargement des playlists utilisateur")
    return res.json()
}

// Review

export const getAlbumReviews = async (albumId, page = 1) => {
    const token = getToken();
    const headers = token
        ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json"};

    const res = await fetch(`${BASE_URL}/albums/${albumId}/reviews?page=${page}&limit=10`, {
        headers
    })
    if(!res.ok) throw new Error ("Erreur lors du chargement des reviews")
    return res.json()
}

export const createReview = async (albumId, { rating, content }) => {
    const res = await fetch(`${BASE_URL}/albums/${albumId}/reviews`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ rating, content })
    })
    if(!res.ok) throw new Error ("Erreur lors de la création de la review")
    return res.json()
}

export const updateReview = async (reviewId, data) => {
    const res = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(data)
    })
    if(!res.ok) throw new Error ("Erreur lors de la modification de la review")
    return res.json()
}

export const deleteReview = async (reviewId) => {
    const res = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: authHeaders()
    })
    if(!res.ok) throw new Error ("Erreur lors de la suppression de la review")
}

// Interaction 

export const likeReview = async (reviewId) => {
    const res = await fetch(`${BASE_URL}/reviews/${reviewId}/like`, {
        method: "POST",
        headers: authHeaders()
    })
    if(!res.ok) throw new Error ("Erreur de like")
    return res.json()
}

export const unlikeReview = async (reviewId) => {
    const res = await fetch(`${BASE_URL}/reviews/${reviewId}/like`, {
        method: "DELETE",
        headers: authHeaders()
    })
    if(!res.ok) throw new Error ("Erreur lors de la suppresion du like")
}

export const createCommentReview = async (reviewId, content) => {

    const token = localStorage.getItem("token");

    const res = await fetch(`/api/v1/reviews/${reviewId}/comment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error("Erreur commentaire");
    }

    const data = await res.json();
    return data;

}

export const deleteCommentReview = async (commentId) => {
    const res = await fetch(`${BASE_URL}/comments/${commentId}`, {
        method: "DELETE",
        headers: authHeaders()
    })
    if(!res.ok) throw new Error ("Erreur lors de la suppression du commentaire")
}

export const reportReview = async (reviewId, reason) => {
    const res = await fetch(`${BASE_URL}/reviews/${reviewId}/report`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({reason})
    })
    if(!res.ok) throw new Error ("Erreur lors du signalement de la review")
    return res.json()
}

export const toggleFavorite = async (trackData) => {
    const res = await fetch(`${BASE_URL}/playlists/favorites/toggle`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(trackData)
    });

    const data = await res.json();

    if (!res.ok) throw new Error(`Erreur favoris: ${JSON.stringify(data)}`);
    return data;
};

export const getPlaylistById = async (id) => {
  const res = await fetch(`${BASE_URL}/playlists/${id}`, {
    headers: authHeaders()
  });

  return res.json();
};

export const getRandomTrack = async () => {
    const res = await fetch(`${BASE_URL}/albums/random/track`, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Erreur réseau lors de la récupération de la piste aléatoire");
    return res.json();
};

export const getProxyImageUrl = (url) => {
    if (!url) return "/fallback.jpg";
    if (url.startsWith('http')) {
        return `${BASE_URL}/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
};