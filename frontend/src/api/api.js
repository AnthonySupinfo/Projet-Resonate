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

// Playlist 

export const getMyPlaylist = async () => {
    const res = await fetch (`${BASE_URL}/playlists/me`, { headers: authHeaders() })
    if(!res.ok) throw new Error ("Erreur lors du chargement de la playlist")
    return res.json()
}

export const getPlaylist = async (playlistId) => {
    const res = await fetch (`${BASE_URL}/playlists/${playlistId}`, { headers: authHeaders() })
    if(!res.ok) throw new Error ("Erreur lors du chargement de la playlist, playlist introuvable")
    return res.json()
}

export const createPlaylist = async ({ name, description, is_public }) => {
    const res = await fetch(`${BASE_URL}/playlists`, {
        method: "POST",
        headers: authHeaders(),
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
    if(!res.ok) throw new Error ("Erreur lors de la suppression de la playlist")
}

export const removeTrackFromPlaylist = async (playlistId, trackId) => {
    const res = await fetch(`${BASE_URL}/playlists/${playlistId}/tracks/${trackId}`, {
        method: "DELETE",
        headers: authHeaders(),
    })
    if(!res.ok) throw new Error ("Erreur lors de la suppression de la track de la playlist")
}

export const addTrackToPlaylist = async (playlistId, trackId) => {
    const res = await fetch(`${BASE_URL}/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ track_id: trackId })
    })
    if(!res.ok) throw new Error ("Erreur lors de l'ajout à la playlist")
    return res.json()
}

// Review

export const getAlbumReviews = async (albumId, page = 1) => {
    const res = await fetch(`${BASE_URL}/albums/${albumId}/reviews?page=${page}&limit=10`, {
        headers: authHeaders()
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
    const res = await fetch(`${BASE_URL}/reviews/${reviewId}/comment`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({content})
    })
    if(!res.ok) throw new Error ("Erreur lors de la création du commentaire")
    return res.json()
}

export const deleteCommentReview = async (commentId) => {
    const res = await fetch(`${BASE_URL}/comments/${commentId}`, {
        method: "DELETE",
        headers: authHeaders()
    })
    if(!res.ok) throw new Error ("Erreur lors de la suppression du commentaire")
    return res.json()
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