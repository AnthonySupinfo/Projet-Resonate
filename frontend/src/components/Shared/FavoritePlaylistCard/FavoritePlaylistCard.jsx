import { useEffect, useState } from 'react';
import { getMyPlaylist, getPlaylist } from '../../../api/api';
import { useLanguage } from '../../../context/LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';
import './FavoritePlaylistCard.css';

const generateColorFrameForArtist = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000" .substring(0, 6 - c.length) + c;
};

export default function FavoritePlaylistCard({ playlistId }) {
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

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
        return <div className="fav-playlist-card loading">{t('library.loadingPlaylist')}</div>;
    }

    if(!playlist) {
        return (
            <div className="fav-playlist-card empty">
                <h3 className="fav-title">{t('library.favoritePlaylistTitle')}</h3>
                <p className="empty-msg">{t('library.noFavoritePlaylist')}</p>
            </div>
        );
    }

    const tracks = playlist.tracks || []; // sécurité au cas où BDD renvoie null pour tracks

    return (
        <div className="fav-playlist-card">
            <h3 className="fav-title">{playlist.name}</h3>

            <div className="fav-tracks-list">
                {tracks.length === 0 ? (
                    <p className="empty-msg">{t('library.emptyPlaylist')}</p>
                ): (
                    tracks.map((track, index) => {
                        
                        const rawUrl = track.cover_url || track.image || track.album?.image || track.album?.image_url;

                        const artistName = track.artist || "Inconnu";
                        const bgColor = generateColorFrameForArtist(artistName);

                        const coverUrl = rawUrl
                            ? `/api/v1/image-proxy?url=${encodeURIComponent(rawUrl)}`
                            : `https://placehold.co/40x40/${bgColor}/ffffff?text=${encodeURIComponent(artistName)}`;
                        
                        
                        return (
                            <div key={track.id || index} className="fav-track-item" onClick={() => navigate (`/albums/${encodeURIComponent(track.artist)}/${encodeURIComponent(track.name)}`)}>
                                <img src={coverUrl} alt={track.title} className="fav-track-cover" onError={(e) => e.target.src = "https://placehold.co/40x40/2a2a2c/ffffff?text=!"}/>

                                <div className="fav-track-info">
                                    <span className="fav-track-name">{track.name || t('library.unknownTitle')}</span>
                                    <span className="fav-track-artist">{track.artist || t('library.unknownArtist')}</span>
                                </div>
                            </div>
                        );
                    }) 

                )}
                
            </div>
        </div>
    );
}