import { useState, useEffect } from 'react';
import { upsertAlbumStatus, getMyLibrary, getMyPlaylist, addTrackToPlaylist, removeTrackFromPlaylist } from '../../api/api';
import CreatePlaylistModal from '../library/modals/CreatePlaylistModal';
import { useNavigate } from "react-router-dom";
import './AlbumActions.css';

export default function AlbumActions({ albumId }) {
    const [currentStatus, setCurrentStatus] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
            }catch (error) {
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
                    }, 200); // petit délai pour laisser le temps à la mise à jour de se faire avant de rediriger
        } catch (error) {
            console.error ("Erreur mise à jour du statut", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddedToPlaylist = async (playlistId, playlistName) => {
        try {
            await addTrackToPlaylist(playlistId, albumId);
            alert(`Album ajouté avec succès à la playlist "${playlistName}" !`);
        } catch (error) {
            console.error("Erreur lors de l'ajout à la playlist", error);
            alert("Cet album est déjà dans la playlist ou une erreur est survenue.");
        } finally {
            setIsDropdownOpen(false);
        }
    };

    return (
        <div className="album-actions-container">
            <div className="status-group">
                <button
                className={`status-btn ${currentStatus === 'PLANNED' ? 'active' : ''}`}
                onClick={() => handleStatusClick('PLANNED')}
                disabled={isLoading}
                >À écouter</button>

                <button
                className={`status-btn ${currentStatus === 'LISTENING' ? 'active' : ''}`}
                onClick={() => handleStatusClick('LISTENING')}
                disabled={isLoading}
                >En cours</button>

                <button
                className={`status-btn ${currentStatus === 'COMPLETED' ? 'active' : ''}`}
                onClick={() => handleStatusClick('COMPLETED')}
                disabled={isLoading}
                >Terminé</button>

                <button
                className={`status-btn ${currentStatus === 'DROPPED' ? 'active' : ''}`}
                onClick={() => handleStatusClick('DROPPED')}
                disabled={isLoading}
                >Abandonné</button>
            </div>
        

            {/* 
            <div className="playlist-dropdown-wrapper">
                <button 
                    className="add-to-playlist-btn"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <span className="plus-icon">+</span>Ajouter à une playlist
                </button>

                {isDropdownOpen && (
                    <div className="dropdown-menu">
                        <ul className="dropdown-list">
                            <li className="dropdown-item create-option" onClick={() => { setIsCreateModalOpen(true); setIsDropdownOpen(false);}}> Créer une nouvelle playlist</li>
                            {playlists.length === 0 ? (
                                <li className="dropdown-item empty">Aucune playlist</li>
                            ): (
                                playlists.map(playlist => (
                                    <li
                                        key={playlist.id}
                                        className="dropdown-item"
                                        onClick={() => handleAddedToPlaylist(playlist.id, playlist.name)}
                                    > 
                                        {playlist.name}

                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                )}

            </div>
            */}

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