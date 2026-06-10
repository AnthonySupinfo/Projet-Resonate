import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import { getMyPlaylist, addTrackToPlaylist } from "../../../../../api/api.js";
import './PlaylistBox.css';

const generateColorFrame = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
};

export default function PlaylistBox({ activity }) {
    const { user: activityUser, target } = activity;
    const { t } = useLanguage();

    const [myPlaylists, setMyPlaylists] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(false);
    const [toast, setToast] = useState(null);

    const isTrackEvent = activity.type === 'ADD_TRACK_PLAYLIST' || activity.type === 'LIKE_TRACK';

    const safeArtist = target?.artist ? encodeURIComponent(target.artist) : "inconnu";
    const safeAlbum = target?.albumTitle ? encodeURIComponent(target.albumTitle) : "inconnu";

    const albumRoute = `/albums/${safeArtist}/${safeAlbum}`;
    const playlistRoute = `/library/playlists/${target?.id}`;

    const linkRoute = isTrackEvent ? albumRoute : playlistRoute;

    const bgColor = generateColorFrame(target?.name || "default");
    const fallbackCover = `https://ui-avatars.com/api/?name=${encodeURIComponent(target?.name || "default")}&background=${bgColor}&color=fff&size=400&format=svg`;
    const coverSrc = target?.coverUrl && target.coverUrl !== 'null' ? target.coverUrl : fallbackCover;

    useEffect(() => {
        if (isTrackEvent) {
            const fetchPlaylists = async () => {
                try {
                    const data = await getMyPlaylist();
                    setMyPlaylists(data);
                } catch (err) {
                    console.error(err);
                }
            };
            fetchPlaylists();
        }
    }, [isTrackEvent]);

    useEffect(() => {
        const handleClickOutside = () => setOpenDropdown(false);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const handleAddToPlaylist = async (trackName, playlistId) => {
        const targetPlaylist = myPlaylists.find(p => p.id === playlistId);
        const isAlreadyAdded = targetPlaylist?.tracks?.some(t => t.name === trackName);

        if (isAlreadyAdded) return;

        try {
            await addTrackToPlaylist(playlistId, { track_id: trackName, artist: target?.artist });

            setMyPlaylists(prevPlaylists =>
                prevPlaylists.map(p => {
                    if (p.id === playlistId) {
                        const updatedTracks = [...(p.tracks || []), { name: trackName }];
                        return { ...p, tracks: updatedTracks };
                    }
                    return p;
                })
            );

            setToast(`Ajouté à "${targetPlaylist.name}"`);
            setTimeout(() => setToast(null), 2000);
            setOpenDropdown(false);
        } catch (err) {
            console.error(err);
            setToast("Erreur lors de l'ajout");
            setTimeout(() => setToast(null), 2000);
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return "00:00min";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}min`;
    };

    return (
        <div className="social-item-playlist-box">
            <Link to={linkRoute}>
                <img
                    src={coverSrc}
                    alt={isTrackEvent ? "Cover" : t('social.playlistCover')}
                    className="social-playlist-cover"
                />
            </Link>

            <div className="social-playlist-info">
                <h4 className="social-playlist-title">
                    <Link to={linkRoute} className="social-playlist-link">
                        {target?.name}
                    </Link>
                </h4>

                <p className="social-playlist-meta">
                    {isTrackEvent ? (
                        <>{target?.artist} • <Link to={albumRoute} className="social-playlist-link">{target?.albumTitle}</Link> • {formatDuration(target?.duration)}</>
                    ) : (
                        <>{t('social.byAuthor')} <Link to={`/user/${activityUser?.id}`} className="social-playlist-user-link">
                            {activityUser?.name}
                        </Link> • {target?.trackCount} {t('social.tracks')}</>
                    )}
                </p>
            </div>

            {isTrackEvent && (
                <div className="track-dropdown-wrapper">
                    <button
                        className="track-add"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(!openDropdown);
                        }}
                    >
                        +
                    </button>

                    {openDropdown && (
                        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            {myPlaylists.length === 0 ? (
                                <div className="dropdown-item empty">
                                    Aucune playlist — crée-en une
                                </div>
                            ) : (
                                myPlaylists.map((playlist) => {
                                    const isAdded = playlist.tracks?.some(t => t.name === target?.name);

                                    return (
                                        <div
                                            key={playlist.id}
                                            className={`dropdown-item ${isAdded ? 'added' : ''}`}
                                            onClick={() => handleAddToPlaylist(target?.name, playlist.id)}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                cursor: isAdded ? 'default' : 'pointer',
                                                opacity: isAdded ? 0.7 : 1
                                            }}
                                        >
                                            <span>{playlist.name}</span>
                                            {isAdded && <span style={{ color: 'var(--success-icon, #6ee7b7)', fontWeight: 'bold' }}>✓</span>}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {toast && (
                        <div className="social-toast">
                            {toast}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}