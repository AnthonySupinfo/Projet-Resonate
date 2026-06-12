import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlaylist, updatePlaylist, removeTrackFromPlaylist, deletePlaylist } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './PlaylistDetailPage.css';

const generateColorFrame = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
};

export default function PlaylistDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();

    const [playlist, setPlaylist] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchPlaylistDetails = async () => {
            try {
                const data = await getPlaylist(id);
                if(!data.tracks) data.tracks = [];
                setPlaylist(data);
            } catch (error) {
                setMessage(t('playlist.errorLoad'));
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchPlaylistDetails();
    }, [id, t]);

    const handleTogglePrivate = async () => {
        try {
            const updated = await updatePlaylist(id, { is_public: !playlist.is_public });
            setPlaylist({ ...playlist, is_public: updated.is_public });

            window.dispatchEvent(new Event("playlistUpdated"));
        } catch (error) {
            console.error("Erreur lors du changement", error);
        }
    };

    const handleRename = async () => {
        const newName = window.prompt(t('playlist.promptRename'), playlist.name);
        if (newName && newName.trim() !== "" && newName !== playlist.name) {
            try {
                const updated = await updatePlaylist(id, { name: newName.trim() });
                setPlaylist({ ...playlist, name: updated.name });

                window.dispatchEvent(new Event("playlistUpdated"));
            } catch (error) {
                setMessage(t('playlist.errorRename'));
            }
        }
    };

    const handleDeletePlaylist = async () => {
        if (window.confirm(t('playlist.confirmDelete'))) {
            try {
                await deletePlaylist(id);

                window.dispatchEvent(new Event("playlistUpdated"));
                navigate('/library/playlists', { replace: true });
            } catch (error) {
                console.error("Détail de l'erreur de suppression :", error);
                setMessage(`${t('playlist.errorDelete')}${error.message}`);
            }
        }
    };

    const handleRemoveTrack = async (trackId) => {
        try {
            await removeTrackFromPlaylist(id, trackId);
            setPlaylist({...playlist, tracks: playlist.tracks.filter(track => track.id !== trackId)});
        } catch (error) {
            console.error("Erreur lors de la suppression du titre", error);
        }
    };

    if (isLoading) return <div className="playlist-status-msg">{t('playlist.loading')}</div>;
    if (error || !playlist) return <div className="playlist-status-msg error">{t('playlist.notFound')}</div>;

    const bgColor = generateColorFrame(playlist.name || "default");
    const fallbackCover = `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.name)}&background=${bgColor}&color=fff&size=400&format=svg`;

    const currentUserId = user?.user_id || user?.id;
    const isOwner = String(currentUserId) === String(playlist.user_id);

    return (
        <>
            {message && (
                <div className="playlist-message">
                    {message}
                    <button onClick={() => setMessage(null)}>x</button>
                </div>
            )}

            <div className="playlist-detail-page">
                <button className="back-btn" onClick={() => navigate(-1)}>{t('playlist.back')}</button>

                <div className="playlist-header-box">
                    <div className="playlist-header">
                        <img
                            src={playlist.cover_url || playlist.coverUrl || fallbackCover}
                            alt={playlist.name}
                            className="playlist-main-cover"
                        />
                        <div className="playlist-info">
                                <span className="playlist-type">
                                    {playlist.is_public ? t('playlist.publicPlaylist') : t('playlist.privatePlaylist')}
                                </span>
                            <h1 className="playlist-page-title">{playlist.name}</h1>

                            <div className="playlist-creator">
                               {(() => {
                                    const avatar = playlist.avatar_url;
                                    const isUrl = avatar && avatar.startsWith('http');
                                    const isEmoji = avatar && !isUrl;
                                    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.username || 'U')}&background=random&color=fff`;

                                    return isEmoji ? (
                                        <span className="playlist-creator-avatar">{avatar}</span>
                                    ) : (
                                        <img 
                                        src={isUrl ? `/api/v1/image-proxy?url=${encodeURIComponent(avatar)}` : fallback}
                                        alt="Avatar" 
                                        className="playlist-creator-avatar"
                                        onError={(e) => { e.target.src = fallback; }}
                                        />
                                    ); 
                                })()}
                                <span className="playlist-creator-text">Créé par {playlist.username || "Utilisateur inconnu"}</span>
                            </div>

                            {playlist.description && <p className="playlist-desc">{playlist.description}</p>}

                            {isOwner && (
                                <div className="playlist-actions">
                                    <button className="toggle-privacy-btn" onClick={handleTogglePrivate}>
                                        {playlist.is_public ? t('playlist.makePrivate') : t('playlist.makePublic')}
                                    </button>
                                    <button className="toggle-privacy-btn" onClick={handleRename}>{t('playlist.rename')}</button>
                                    <button className="toggle-privacy-btn" onClick={handleDeletePlaylist}>{t('playlist.delete')}</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="tracklist-section">
                    <h3>{t('playlist.tracksCount')} ({playlist.tracks.length})</h3>

                    {playlist.tracks.length === 0 ? (
                        <p className="empty-tracklist">{t('playlist.emptyPlaylist')}</p>
                    ) : (
                        <div className="track-table">
                            <div className="track-header">
                                <span></span>
                                <span></span>
                                <span>{t('playlist.trackTitle')}</span>
                                <span>{t('playlist.artist')}</span>
                                <span>{t('playlist.album')}</span>
                                <span>{t('playlist.duration')}</span>
                                <span></span>
                            </div>

                            {playlist.tracks.map((track, index) => {
                                const rawUrl = track.album_image || track.album?.image_url || track.album_image || track.cover_url || track.image;
                                const artistName = track.artist || "Inconnu";
                                const trackBgColor = generateColorFrame(artistName);

                                const trackCoverUrl = rawUrl
                                    ? `/api/v1/image-proxy?url=${encodeURIComponent(rawUrl)}`
                                    : `https://placehold.co/40x40/${trackBgColor}/ffffff?text=${encodeURIComponent(artistName[0])}`;
                        
                                
                                const minutes = Math.floor((track.duration || 0) / 60);
                                const seconds = String((track.duration || 0) % 60).padStart(2, '0');
                                const durationFormatted = track.duration ? `${minutes}:${seconds}` : "--:--";

                                return (
                                    <div key={track.id} className="track-row" onClick={() => navigate(`/albums/${encodeURIComponent(track.artist)}/${encodeURIComponent(track.album_name)}`)}>
                                        <span className="track-number">{index + 1}</span>
                                        <div className="track-cover-cell">
                                            <img src={trackCoverUrl} alt="" className="track-row-cover" onError={(e) => { e.target.src = "https://placehold.co/40x40/2a2a2c/ffffff?text=!"; }} />
                                        </div>
                                        <span className="track-name">{track.name}</span>
                                        <span className="track-artist">{track.artist}</span>
                                        <span className="track-album">{track.album_name || "N/A"}</span>
                                        <span className="track-duration">{durationFormatted}</span>

                                        <div className="track-actions">
                                            {isOwner && (
                                                <button
                                                    className="remove-track-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveTrack(track.id);
                                                    }}
                                                    title={t('playlist.removeTrack')}>X</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}