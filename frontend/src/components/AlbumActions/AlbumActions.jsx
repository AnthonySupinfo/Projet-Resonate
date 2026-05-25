import { useState, useEffect } from 'react';
import { upsertAlbumStatus, getMyLibrary, getMyPlaylist } from '../../../api/api';
import './AlbumActions.css';

export default function AlbumActions({ albumId }) {
    const [currentStatus, setCurrentStatus] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [getMyPlaylists, setMyPlaylists] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const library = await getMyLibrary();
                const existingItem = library.find(item => String(item.album_id) === String(albumId));
                if (existingItem) {
                    setCurrentStatus(existingItem.status);
                }

                const playlists = await getMyPlaylist();
                setMyPlaylists(playlists);
            }catch (error) {
                console.error("Erreur lors du chargement des données AlbumActions", error);
            }
        };

        if (albumId) fetchData();
    }, [albumId]);

    // màj de la BDD 
    const handleStatusClick = async (newStatus) => {
        setIsLoading(true);
        try {
            await upsertAlbumStatus(albumId, newStatus);
            setCurrentStatus(newStatus);
        } catch (error) {
            console.error ("Erreur mise à jour du statut", error);
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
                            {getMyPlaylists.length === 0 ? (
                                <li className="dropdown-item empty">Aucune playlist</li>
                            ): (
                                getMyPlaylists.map(playlist => (
                                    <li
                                        key={playlist.id}
                                        className="dropdown-item"
                                        onClick={() => {
                                            console.log(`Ajout du track à la playlist ${playlist.id}`); // à modifier quand Krishna aura sa partie
                                            setIsDropdownOpen(false);
                                        }}
                                    > {playlist.name}

                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                )}

            </div>
        </div>
    );
}