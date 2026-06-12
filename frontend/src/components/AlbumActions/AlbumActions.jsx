import { useState, useEffect } from 'react';
import { upsertAlbumStatus, getMyLibrary, getMyPlaylist } from '../../api/api';
import CreatePlaylistModal from '../library/modals/CreatePlaylistModal';
import { useNavigate } from "react-router-dom";
import './AlbumActions.css';
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function AlbumActions({ albumId }) {
    const [currentStatus, setCurrentStatus] = useState(null);
    const [playlists, setPlaylists] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { t } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const library = await getMyLibrary();
                const existingItem = library.find(item => String(item.album_id) === String(albumId));
                if (existingItem) {
                    setCurrentStatus(existingItem.status);
                }

                const fetchedPlaylists = await getMyPlaylist();
                setPlaylists(fetchedPlaylists);
            } catch (error) {
                console.error("Erreur lors du chargement des données AlbumActions", error);
            }
        };

        if (albumId) fetchData();
    }, [albumId]);

    const handleStatusClick = async (newStatus) => {
        setIsLoading(true);
        try {
            await upsertAlbumStatus(albumId, newStatus);
            setCurrentStatus(newStatus);
            window.dispatchEvent(new Event("libraryUpdated"));

            setTimeout(() => {
                navigate("/library/albums");
            }, 200);
        } catch (error) {
            console.error("Erreur mise à jour du statut", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="album-actions-container">
            <div className="status-group">
                <button
                    className={`status-btn ${currentStatus === 'PLANNED' ? 'active' : ''}`}
                    onClick={() => handleStatusClick('PLANNED')}
                    disabled={isLoading}
                >
                    {t('album.planned')}
                </button>

                <button
                    className={`status-btn ${currentStatus === 'LISTENING' ? 'active' : ''}`}
                    onClick={() => handleStatusClick('LISTENING')}
                    disabled={isLoading}
                >
                    {t('album.listening')}
                </button>

                <button
                    className={`status-btn ${currentStatus === 'COMPLETED' ? 'active' : ''}`}
                    onClick={() => handleStatusClick('COMPLETED')}
                    disabled={isLoading}
                >
                    {t('album.completed')}
                </button>

                <button
                    className={`status-btn ${currentStatus === 'DROPPED' ? 'active' : ''}`}
                    onClick={() => handleStatusClick('DROPPED')}
                    disabled={isLoading}
                >
                    {t('album.dropped')}
                </button>
            </div>

            <CreatePlaylistModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onPlaylistCreated={(newPlaylist) => {
                    setPlaylists([newPlaylist, ...playlists]);
                }}
            />
        </div>
    );
}