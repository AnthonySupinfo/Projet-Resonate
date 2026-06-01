import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPlaylist, getMyLibrary } from '../../../api/api';
import CreatePlaylistModal from '../modals/CreatePlaylistModal';
import './LibraryCard.css';

export default function LibraryCard() {
    const [activeTab, setActiveTab] = useState('playlists'); // state pour gérer l'onglet actif
    const [playlists, setPlaylists] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const [playlist, album] = await Promise.all([getMyPlaylist(), getMyLibrary()]);
                setPlaylists(playlist);
                setAlbums(album);
            } catch (err) {
                console.error("LibraryCard fetch error", err)
            }
        };
        load();
        window.addEventListener("playlistUpdated", load);
        return () => window.removeEventListener("playlistUpdated", load);
    }, []);

    const handlePlaylistCreated = (newPlaylist) => setPlaylists([newPlaylist, ...playlists]);

    return (
        <div className="library-card-container">
            <h3 className="library-title" onClick={() => navigate('/library')} style={{ cursor: 'pointer' }}>Librarie</h3>

            <div className="library-tabs">
                <button
                    className={`tab ${activeTab === 'playlists' ? 'active' : ''}`}
                    onClick={() => setActiveTab('playlists')}
                >
                    Playlists
                </button>
                <button
                    className={`tab ${activeTab === 'albums' ? 'active' : ''}`}
                    onClick={() => setActiveTab('albums')}
                >
                    Albums
                </button>
            </div>

            {activeTab === 'playlists' && (
                <ul className="library-list">
                    <li className='library-item'>
                        <div className="library-icon favorite">♥</div>
                        <div className="library-info">
                            <span className="library-name">Musique favorites</span>
                            <span className="library-meta">   Playlist</span>
                        </div>
                    </li>
                    {playlists.map(playlist => (
                    <li key={playlist.id} className="library-item" onClick={() => navigate (`/library/playlists/${playlist.id}`)}>
                        <div className="library-icon cover-placeholder">
                            <img src={playlist.cover_url || `https://placehold.co/40x40/1a1a1a/ffffff?text=${playlist.name[0]}`} alt={playlist.name}/>
                        </div>
                        <div className="library-info">
                            <span className="library-name">{playlist.name}</span>
                            <span className="library-meta">   Playlist • {playlist.is_public ? 'Publique'  : 'Privée'}</span>
                        </div>
                    </li>
                    ))}
                </ul>
            )}

            {activeTab === 'albums' && (
                <ul className="library-list">
                    {albums.length === 0 ? (
                        <li className='library-item'>
                            <div className="library-info">
                                <span className="library-name">Aucun album sauvegardé</span>
                            </div>
                        </li>
                    ) : albums.map(item => {
                        const a = item.album || item;
                        return (
                            <li key={item.id} className="library-item">
                                <div className="library-icon cover-placeholder">
                                    <img src={a.image_url || `https://placehold.co/40x40/2a2a2c/ffffff?text=${(a.name || '?') [0]}`} alt={a.name} />
                                </div>
                                <div className="library-info">
                                    <span className="library-name">{a.name}</span>
                                    <span className="library-meta">{a.artist_name} • {item.status}</span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
             )}

            <button className="create-btn" onClick={() => setIsModalOpen(true)}>
                <span className="create-icon">+</span>Créer une playlist
            </button>

            <CreatePlaylistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onPlaylistCreated={handlePlaylistCreated} />
        </div>
    );
}