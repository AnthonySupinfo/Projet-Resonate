// API musique (albums, artistes, recherche)
// Routes publiques, sans authentification

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000" + "api/v1";

async function apiGet(path) {
  try {
    const response = await fetch(`${BASE_URL}${path}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Erreur inconnue");
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur API Last.fm :", error);
    throw error;
  }
}

//   FONCTIONS PUBLIQUES

export async function searchAlbums(query) {
  return apiGet(`/api/v1/albums/search?q=${encodeURIComponent(query)}`);
}

export async function getAlbumDetail(artist, album) {
  return apiGet(
    `/api/v1/albums/detail/${encodeURIComponent(artist)}/${encodeURIComponent(album)}`,
  );
}

export async function getArtistDetail(name) {
  return apiGet(`/api/v1/albums/artist/${encodeURIComponent(name)}`);
}
