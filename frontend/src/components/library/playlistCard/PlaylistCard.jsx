import "./PlaylistCard.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { updatePlaylist } from "../../../api/api";
import { useLanguage } from "../../../context/LanguageContext.jsx";

export default function PlaylistCard({ playlist, onPlaylistUpdated }) {
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(playlist?.is_favorite || false);
    const [isLiking, setIsLiking] = useState(false);
    const { t } = useLanguage();

    if (!playlist) return null;

    const coverUrl = playlist.cover_url || playlist.coverUrl || `https://placehold.co/400x400/2a2a2c/ffffff?text=${encodeURIComponent(playlist.name)}`;
    const metaText = playlist.trackCount ? `${playlist.trackCount} ${t('library.tracksCount')}` : t('library.customPlaylistMeta');

    const handleFavoriteCLick = async (e) => {
        e.stopPropagation(); // empeche d'afficher page détail playlist
        if(isLiking) return;

        const nextStatus = !isFavorite;
        setIsFavorite(nextStatus);
        setIsLiking(true);

        try {
            const updated = await updatePlaylist(playlist.id, { is_favorite: nextStatus });
            if (onPlaylistUpdated) {
                onPlaylistUpdated(updated);
            }
            window.dispatchEvent(new Event("favoriteChanged")); // prévient toutes l'application que favori a changé
        } catch (error) {
            console.error(error);
            setIsFavorite(!nextStatus); // annulation en cas échec
        } finally {
            setIsLiking(false);
        }
    };

    return (
        <div className="playlist-card" onClick={() => navigate(`/library/playlists/${playlist.id}`)}>
            <div className="playlist-cover-wrapper">
                <img
                    src={coverUrl}
                    alt={playlist.name}
                    className="playlist-cover"
                />

                <button
                    className={`playlist-fav-btn ${isFavorite ? 'is-fav' : ''}`}
                    onClick={handleFavoriteCLick}
                    disabled={isLiking}
                >♥</button>

                {playlist.id && (
                    <span className={`playlist-badge ${playlist.is_public ? 'public' : 'private'}`}>
                        {playlist.is_public ? t('library.badgePublic') : t('library.badgePrivate')}
                    </span>
                )}
            </div>
            <h4 className="playlist-title">{playlist.name}</h4>
            <p className="playlist-meta">{metaText}</p>
        </div>
    );
}