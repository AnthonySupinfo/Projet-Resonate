import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlaylist, updatePlaylist, removeTrackFromPlaylist, deletePlaylist } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './PlaylistDetailPage.css';

export default function PlaylistDetailPage() {
    const { id } = useParams(); // récup ID playlist dans URL
    const navigate = useNavigate();
    const { user } = useAuth();

    const [playlist, setPlaylist] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPlaylistDetails = async () => {
            try {
                const data = await getPlaylist(id);
                if(!data.tracks) data.tracks = [] ; // renvoie un tableau vide si BDD ne renvoie pas de tracks
                setPlaylist(data);
            } catch (error) {
                console.error("Erreur chargement playlist", error);
                setError("Impossible de charger la playlist");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchPlaylistDetails();
    }, [id]);

    const handleTogglePrivate = async () => {
        try {
            const updated = await updatePlaylist(id, { is_public: !playlist.is_public });
            setPlaylist({ ...playlist, is_public: updated.is_public }); // màj de l'affichage

            window.dispatchEvent(new Event("playlistUpdated"));
        } catch (error) {
            console.error("Erreur lors du changement", error);
        }
    };

    const handleRename = async () => {
        const newName = window.prompt("Entrez le nouveau nom de la playlist :", playlist.name);
        if (newName && newName.trim() !== "" && newName !== playlist.name ) {
            try {
                const updated = await updatePlaylist(id, { name: newName.trim() });
                setPlaylist({ ...playlist, name: updated.name });

                window.dispatchEvent(new Event("playlistUpdated"));
            } catch (error) {
                alert("Erreur lros du renommage de la playlist.");
            }
        }
    };

    const handleDeletePlaylist = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette playlist ?")) {
            try {
                await deletePlaylist(id);

                window.dispatchEvent(new Event("playlistUpdated"));
                navigate('/library/playlists', { replace: true });
            } catch (error) {
                console.error("Détail de l'erreur de suppression :", error);
                alert('Impossible de supprimer: ${error.message}');
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

    if (isLoading) return <div className="playlist-status-msg">Chargement de la playlist...</div>;
    if (error || !playlist) return <div className="playlist-status-msg error">Playlist introuvable.</div>;

    const currentUserId = user?.user_id || user?.id;
    const isOwner = String(currentUserId) === String(playlist.user_id);

    return (
        <div className="playlist-detail-page">
            <button className="back-btn" onClick={() => navigate(-1)}>← Retour</button>
            <div className="playlist-header">
                <img
                    src={playlist.cover_url || playlist.coverUrl ||  "https://placehold.co/200x200/2a2a2c/ffffff?text=Playlist"}
                    alt={playlist.name}
                    className="playlist-main-cover"
                />
                <div className="playlist-info">
                    <span className="playlist-type">
                        {playlist.is_public ? 'Playlist publique' : 'Playlist privée'}
                    </span>
                    <h1 className="playlist-title">{playlist.name}</h1>
                    {playlist.description && <p className="playlist-desc">{playlist.description}</p>}

                    {isOwner && (
                        <div className="playlist-actions">
                            <button className="toggle-privacy-btn" onClick={handleTogglePrivate}>
                                Rendre {playlist.is_public ? 'Privée' : 'Publique'}
                            </button>
                            <button className="toggle-privacy-btn" onClick={handleRename}>Renommer</button>
                            <button className="toggle-privacy-btn" onClick={handleDeletePlaylist}>Supprimer la playlist</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="tracklist-section">
                <h3>Titres ({playlist.tracks.length})</h3>

                {playlist.tracks.length === 0 ? (
                    <p className="empty-tracklist">Cette playlist est vide pour le moment.</p>
                ) : (
                    <ul className="tracklist">
                        {playlist.tracks.map((track, index) => (
                            <li
                                key={track.id}
                                className="track-item"
                                onClick={() => navigate(`/albums/${encodeURIComponent(track.artist)}/${encodeURIComponent(track.album_name)}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span className="track-number">{index + 1}</span>
                                <div className="track-details">
                                    <span className="track-name">{track.name || "Titre inconnu"}</span>
                                    <span className="track-artist">{track.artist || "Artiste inconnu"}</span>
                                </div>
                                {isOwner && ( 
                                    <button className="remove-track-btn" onClick={() => handleRemoveTrack(track.id)} title="Retirer de la playlist">Supprimer</button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

