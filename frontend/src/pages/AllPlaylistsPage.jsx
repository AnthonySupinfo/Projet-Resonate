import React, { useState, useEffect } from 'react';
import PlaylistCard from '../components/library/playlistCard/PlaylistCard';
import CreatePlaylistModal from '../components/library/modals/CreatePlaylistModal';
import { getMyPlaylist } from '../api/api';
import './AllPlaylistsPage.css';


export default function AllPlaylistsPage() {
    const [playlists, setPlaylists] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [sortType, setSortType] = useState("date");
    const [sortOrder, setSortOrder] = useState("desc");

    useEffect(() => {
        const fetchPlaylist = async () => {
            try {
                const data = await getMyPlaylist();
                setPlaylists(data.length > 0 ? data : []);
            } catch (error) {
                console.error("Erreur API, utilisation des fausses données");
                setPlaylists([]);
            }
        };
        fetchPlaylist();
    }, []);

    const handlePlaylistCreated = (newPlaylist) => {
        setPlaylists([newPlaylist, ...playlists]);
    };

    const handlePlaylistStatusChange = (updatedPlaylist) => {
        setPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
    };

    const filteredAndSortedPlaylists = playlists 
        .filter(playlist => {
            return playlist.name.toLowerCase().includes(searchQuery.toLowerCase());
        })
        .sort((a, b) => {
            let comparison = 0;

            if (sortType === "alpha") {
                comparison = a.name.localeCompare(b.name);
            } else if (sortType === "date") {
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                comparison = dateA - dateB;
            }

            return sortOrder === "asc" ? comparison : -comparison;
        });

    return (
        <div className="all-page-content">

            <div className="filters-container">
                <div className="search-input-wrapper">
                    <input
                        type="text"
                        className="playlist-search-input"
                        placeholder="Rechercher dans les playlists personnalisées"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="sort-controls">
                    <span className="sort-label">Trier par</span>
                    <select 
                        className="sort-select"
                        value={sortType}
                        onChange={(e) => setSortType(e.target.value)}
                    >
                        <option value="date">Date de création</option>
                        <option value="alpha">Ordre alphabétique</option>
                    </select>
                    <select 
                        className="sort-select"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        {sortType === "date" ? (
                            <>
                                <option value="desc">Du plus récent au plus ancien</option>
                                <option value="asc">Du plus ancien au plus récent</option>
                            </>
                        ) : (
                            <>
                                <option value="asc">De A à Z</option>
                                <option value="desc">De Z à A</option>
                            </>
                        )}
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

                    {filteredAndSortedPlaylists.map(playlist => (
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
