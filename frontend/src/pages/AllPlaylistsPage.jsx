import React, { useState, useEffect } from 'react';
import PlaylistCard from '../components/library/playlistCard/PlaylistCard';
import CreatePlaylistModal from '../components/library/modals/CreatePlaylistModal';
import { getMyPlaylist } from '../api/api';
import './AllPlaylistsPage.css';


export default function AllPlaylistsPage() {
    const [playlists, setPlaylists] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Chargement playlist depuis backend 
    useEffect(() => {
        const fetchPlaylist = async () => {
            try {
                const data = await getMyPlaylist();
                setPlaylists(data.length > 0 ? data : []);
                console.log("PLAYLISTS:", data);
            } catch (error) {
                console.error("Erreur API, utilisation des fausses données");
                setPlaylists([]);
            }
        };
        fetchPlaylist();
    }, []);

    const handlePlaylistCreated = (newPlaylist) => {
        setPlaylists([newPlaylist, ...playlists]); // ajoute new playlist dans liste
    };

    const handlePlaylistStatusChange = (updatedPlaylist) => {
        setPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
    };

    return (
        <div className="all-page-content">

            {/* à remplacer par la search bar codé par Krishna */}
            <div className="topbar-placeholder"></div>

            <div className="filters-container">
                <div className="search-input-wrapper">
                    <input
                        type="text"
                        className="playlist-search-input"
                        placeholder="Rechercher dans les playlists personnalisées"
                    />
                </div>

                <div className="sort-controls">
                    <span className="sort-label">Trier par</span>
                    <select className="sort-select">
                        <option>Date de création</option>
                        <option>Ordre alphabétique</option>
                    </select>
                    <select className="sort-select">
                        <option>Du plus récent au plus ancien</option>
                        <option>Du plus ancien au plus récent</option>
                    </select>
                </div>
            </div>

            <div className="playlists-section">
                <h2 className="section-title">Playlists personnalisées</h2>

                <div className="playlist-grid">
                    
                    <div className="static-card create-card" onClick={() => setIsModalOpen(true)}>
                        <div className="static-cover create-cover">
                            <span className="plus-icon">+</span>
                        </div>

                        <h4 className="static-title">Créer une nouvelle playlist</h4>
                    </div>

                    {/*
                    <div className="static-card favorites-card">
                        <div className="static-cover favorites-cover">
                            <span className="heart-icon">♥</span>
                        </div>

                        <h4 className="static-title">Musique favorites</h4>
                        <p className="static-meta">102 musiques</p>
                    </div>
                    */}

                    {/* Boucle d'affichage */}
                    {playlists.map(playlist => (
                        <PlaylistCard key={playlist.id} playlist={playlist} onPlaylistUpdated={handlePlaylistStatusChange}/>
                    ))}
                </div>
            </div>

            <CreatePlaylistModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onPlaylistCreated={handlePlaylistCreated}
            />

        </div>
    )
}
