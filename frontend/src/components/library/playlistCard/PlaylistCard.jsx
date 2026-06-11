import "./PlaylistCard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { updatePlaylist } from "../../../api/api";
import { useLanguage } from "../../../context/LanguageContext.jsx";

const generateColorFrame = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000" .substring(0, 6 - c.length) + c;
};


export default function PlaylistCard({ playlist, onPlaylistUpdated }) {
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(playlist?.is_favorite || false);
    const [isLiking, setIsLiking] = useState(false);
    const { t } = useLanguage();
    
    if (!playlist) return null;

    const isDefault = playlist.type === 'DEFAULT' || playlist.name === 'Musiques favorites';

    useEffect(() => {
        setIsFavorite(playlist?.is_favorite || false);
    }, [playlist?.is_favorite]);

    const bgColor = generateColorFrame(playlist.name || "default");
    const coverUrl = playlist.cover_url || playlist.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.name)}&background=${bgColor}&color=fff&size=400&format=svg`;
    const metaText = playlist.trackCount ? `${playlist.trackCount} ${t('library.tracksCount')}` : t('library.customPlaylistMeta');

    const handleFavoriteCLick = async (e) => {
        e.stopPropagation(); 
        if(isLiking) return;

        const nextStatus = !isFavorite;
        setIsFavorite(nextStatus);
        setIsLiking(true);

        try {
            const updated = await updatePlaylist(playlist.id, { is_favorite: nextStatus });
            if (onPlaylistUpdated) {
                onPlaylistUpdated(updated);
            }
            window.dispatchEvent(new Event("favoriteChanged")); 
        } catch (error) {
            console.error(error);
            setIsFavorite(!nextStatus);
        } finally {
            setIsLiking(false);
        }
    };

    return (
        <div className="playlist-card" onClick={() => navigate(`/library/playlists/${playlist.id}`)}>
            <div className="playlist-cover-wrapper">
                {isDefault ? (
                    <div className="playlist-cover favorite-default-style">
                        <span>♥</span>
                    </div>
                ) : (
                    <img
                    src={coverUrl}
                    alt={playlist.name || "Playlist"}
                    className="playlist-cover"
                    />
                )}
        

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