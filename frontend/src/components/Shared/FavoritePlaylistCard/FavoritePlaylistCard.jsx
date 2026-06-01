import { useEffect, useState } from 'react';
import { getMyPlaylist, getPlaylist } from '../../../api/api';
import './FavoritePlaylistCard.css';

export default function FavoritePlaylistCard({ playlistId }) {
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavoritePlaylist = async () => {
            try {
                const allPlaylists = await getMyPlaylist();
                const favMeta = allPlaylists.find(p => p.is_favorite === true);

                if(favMeta) {
                    const data = await getPlaylist(favMeta.id);
                    setPlaylist(data);
                } else {
                    setPlaylist(null);
                }
            } catch (error) {
                console.error("Erreur chargement playlist favorite", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFavoritePlaylist();
        window.addEventListener("favoriteChanged", fetchFavoritePlaylist);

        return () => window.removeEventListener("favoriteChanged", fetchFavoritePlaylist);
    }, []);

    if(loading) {
        return <div className="fav-playlist-card loading">Chargement...</div>;
    }

    if(!playlist) {
        return (
            <div className="fav-playlist-card empty">
                <h3 className="fav-title">Playlist Favorite</h3>
                <p className="empty-msg">Aucune playlist favorite sélectionnée. Cliquez sur le coeur d'une playlist.</p>
            </div>
        );
    }

    const tracks = playlist.tracks || []; // sécurité au cas où BDD renvoie null pour tracks

    return (
        <div className="fav-playlist-card">
            <h3 className="fav-title">{playlist.name}</h3>

            <div className="fav-tracks-list">
                {tracks.length === 0 ? (
                    <p className="empty-msg">Cette playlist est vide.</p>
                ): (
                    tracks.map((track, index) => (
                        <div key={track.id || index} className="fav-track-item">
                            <img src={track.cover_url || `https://placehold.co/40x40/2a2a2c/ffffff?text=${track.title?.[0] || 'M'}`} alt={track.title} className="fav-track-cover"/>

                            <div className="fav-track-info">
                                <span className="fav-track-name">{track.title || "Titre inconnu"}</span>
                                <span className="fav-track-artist">{track.artist || "Artiste inconnu"}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}