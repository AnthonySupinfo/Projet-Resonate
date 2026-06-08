import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPlaylist, getMyLibrary } from '../../../api/api';
import CreatePlaylistModal from '../modals/CreatePlaylistModal';
import { useLanguage } from '../../../context/LanguageContext.jsx';
import './LibraryCard.css';

export default function LibraryCard() {
    const [activeTab, setActiveTab] = useState('playlists'); // state pour gérer l'onglet actif
    const [playlists, setPlaylists] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();

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

    const handlePlaylistCreated = (newPlaylist) => {
        setPlaylists([newPlaylist, ...playlists]);
        window.dispatchEvent(new Event("playlistUpdated"));
    };

    return (
        <div className="library-card-container">
            <h3 className="library-title" onClick={() => navigate('/library')} style={{ cursor: 'pointer' }}>{t('library.libraryTitle')}</h3>

            <div className="library-tabs">
                <button
                    className={`tab ${activeTab === 'playlists' ? 'active' : ''}`}
                    onClick={() => setActiveTab('playlists')}
                >
                    {t('library.tabPlaylists')}
                </button>
                <button
                    className={`tab ${activeTab === 'albums' ? 'active' : ''}`}
                    onClick={() => setActiveTab('albums')}
                >
                    {t('library.tabAlbums')}
                </button>
            </div>

            {activeTab === 'playlists' && (
                <ul className="library-list">
                    <li className='library-item'>
                        <div className="library-icon favorite">♥</div>
                        <div className="library-info">
                            <span className="library-name">{t('library.favoriteTracks')}</span>
                            <span className="library-meta">   {t('library.playlistMeta')}</span>
                        </div>
                    </li>
                    {playlists.map(playlist => (
                        <li key={playlist.id} className="library-item" onClick={() => navigate (`/library/playlists/${playlist.id}`)}>
                            <div className="library-icon cover-placeholder">
                                <img src={playlist.cover_url || `https://placehold.co/40x40/1a1a1a/ffffff?text=${playlist.name[0]}`} alt={playlist.name}/>
                            </div>
                            <div className="library-info">
                                <span className="library-name">{playlist.name}</span>
                                <span className="library-meta">   {t('library.playlistMeta')} • {playlist.is_public ? t('library.publicStatus') : t('library.privateStatus')}</span>
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
                                <span className="library-name">{t('library.noSavedAlbums')}</span>
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
                <span className="create-icon">+</span>{t('library.createPlaylistBtn')}
            </button>

            <CreatePlaylistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onPlaylistCreated={handlePlaylistCreated} />
        </div>
    );
}