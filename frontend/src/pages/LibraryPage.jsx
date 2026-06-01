import { useEffect, useState, useCallback } from 'react';
import Carousel from '../components/library/carousel/Carousel'
import PlaylistCard from '../components/library/playlistCard/PlaylistCard';
import AlbumCard from '../components/library/albumCard/AlbumCard';
import './LibraryPage.css';
import { getMyLibrary, getMyPlaylist } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { Chart, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Legend, Tooltip } from 'chart.js';
import CreatePlaylistModal from '../components/library/modals/CreatePlaylistModal';

ChartJS.register(ArcElement, Tooltip, Legend);

// Données mockés pour tester visu 

const fallbackAlbums = [
    { id: 1, status: 'COMPLETED', album: { id: 101, name: "BULLY", artist_name: "Kanye West", image_url: "https://placehold.co/400x400/2a2a2c/ffffff?text=BULLY"} },
    { id: 2, status: 'LISTENING', album: { id: 102, name: "BULLY", artist_name: "Kanye West", image_url: "https://placehold.co/400x400/2a2a2c/ffffff?text=BULLY"} },
    { id: 3, status: 'PLANNED', album: { id: 103, name: "BULLY", artist_name: "Kanye West", image_url: "https://placehold.co/400x400/2a2a2c/ffffff?text=BULLY"} },
    { id: 4, status: 'DROPPED', album: { id: 104, name: "BULLY", artist_name: "Kanye West", image_url: "https://placehold.co/400x400/2a2a2c/ffffff?text=BULLY"} },
    { id: 5, status: 'COMPLETED', album: { id: 105, name: "BULLY", artist_name: "Kanye West", image_url: "https://placehold.co/400x400/2a2a2c/ffffff?text=BULLY"} }
];
/*
    { id: 2, title:"Clair Obscur", artist: "Lomepal", year: "2023", coverUrl: "https://placehold.co/400x400/1e40af/ffffff?text=Clair+Obscure"},
    { id: 3, title: "ARRANG", artist: "BTS", year: "2020", coverUrl: "https://placehold.co/400x400/1e40af/ffffff?text=ARRANG"},
    { id: 4, title: "THIS MUSIC MAY...", artist: "ABBA", year: "2020", coverUrl: "https://placehold.co/400x400/b91c1c/ffffff?text=ABBA"},
    { id: 5, title: "Fête foraine", artist: "Christophe Maé", year: "2025", coverUrl: "https://placehold.co/400x400/1a1a1a/ffffff?text=Fete"},
];

const fallbackPlaylists = [
    { id: 101, name: "Musique à écouter", trackCount: 12, coverUrl: "https://placehold.co/400x400/ea586c/ffffff?text=A+Ecouter"},
    { id: 102, name: "The fate of Ophelia", trackCount: 86, coverUrl: "https://placehold.co/400x400/166534/ffffff?text=Ophelia"},
    { id: 103, name: "The fame", trackCount: 86, coverUrl: "https://placehold.co/400x400/1e40af/ffffff?text=Gaga"},
    { id: 104, name: "The life of a Show...", trackCount: 46, coverUrl: "https://placehold.co/400x400/b91c1c/ffffff?text=Show"},
    { id: 105, name: "The weeknd", trackCount: 29, coverUrl: "https://placehold.co/400x400/1a1a1a/ffffff?text=The+Weeknd"},
    { id: 106, name: "Bestof Mickael Jackson", trackCount: 53, coverUrl: "https://placehold.co/400x400/d97706/ffffff?text=Michael+Jackson"},
]; */

export default function LibraryPage() {
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [userAlbums, setUserAlbums] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [stats, setStats] = useState({
        albumsSauvegardes: 0,
        albumTermines: 0,
        albumEnCours: 0,
        albumPlanned: 0,
        albumDropped: 0,
        playlistsCrees: 0
    });

    const fetchUserData = useCallback(async () => {
        try {
            const [playlistData, libraryData] = await Promise.all([
                getMyPlaylist(),
                getMyLibrary()
            ]);

            setUserPlaylists(playlistData.length > 0 ? playlistData : []);

            // A supprimer après test : 
            const actualLibraryData = libraryData.length > 0 ? libraryData : fallbackAlbums;
            setUserAlbums(actualLibraryData);

            // à remettre après test : 
            // setUserAlbums(libraryData.length > 0 ? libraryData : []);

            setStats({ // modifier actuallibrary par juste libraryData
                    albumsSauvegardes: actualLibraryData.length,
                    albumTermines: actualLibraryData.filter (item => item.status === 'COMPLETED').length,
                    albumEnCours: actualLibraryData.filter (item => item.status === 'LISTENING').length,
                    albumPlanned: actualLibraryData.filter (item => item.status === 'PLANNED').length,
                    albumDropped: actualLibraryData.filter (item => item.status === 'DROPPED').length,
                    playlistsCrees: playlistData.length
                });
        } catch (error) {
                console.error("Erreur lors de la récupération des données", error);
                setUserPlaylists([]);
                setUserAlbums(fallbackAlbums); // modifier tableau vide après test
                // à décommenter après tests 
                // setStats({ albumsSauvegardes: 0, albumTermines: 0, albumEnCours: 0, albumPlanned: 0, albumDropped: 0, playlistsCrees: 0 });
                setStats({  // a sup après tests
                    albumsSauvegardes: fallbackAlbums.length, 
                    albumTermines: fallbackAlbums.filter (item => item.status === 'COMPLETED').length,
                    albumEnCours: fallbackAlbums.filter (item => item.status === 'LISTENING').length,
                    albumPlanned: fallbackAlbums.filter (item => item.status === 'PLANNED').length,
                    albumDropped: fallbackAlbums.filter (item => item.status === 'DROPPED').length,
                    playlistsCrees: 0
                });
        } finally {
                setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserData();

        window.addEventListener("playlistUpdated", fetchUserData);
        window.addEventListener("favoriteChanged", fetchUserData);

        return () => {
            window.removeEventListener("playlistUpdated", fetchUserData);
            window.removeEventListener("favoriteChanged", fetchUserData);
        };
    }, [fetchUserData]);

    const handlePlaylistStatusChange = (updatedPlaylist) => {
        setUserPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
    };

    const handlePlaylistCreated = (newPlaylist) => {
        setUserPlaylists([newPlaylist, ...userPlaylists]);
        setStats(prev => ({ ...prev, playlistsCrees: prev.playlistsCrees + 1 }));
    };

    const hasAlbum = stats.albumsSauvegardes > 0;

    const donutData = {
        labels: ['Terminés', 'En cours', 'À écouter', 'Abandonnées'],
        datasets: [{
            data: [
                stats.albumTermines,
                stats.albumEnCours,
                stats.albumPlanned,
                stats.albumDropped
            ],
            backgroundColor: ['#f1a2a2', '#c4a5b5', '#8e8e93', '#48484a'],
            borderColor: ['#35313A'],
            borderWidth: 4,
        }]
    };

    const donutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#f2f3fb',
                    font: { family: 'Inter', size: 13 },
                    padding: 16,
                    usePointStyle: true,
                }
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const total = stats.albumsSauvegardes;
                        const val = ctx.parsed;
                        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                        return ` ${val} album${val > 1 ? 's' : ''} (${pct}%)`;
                    }
                }
            }
        }
    };

    return (
        <div className="library-page-content">

            {/* à remplacer par la search bar codé par Krishna */}
            <div className="topbar-placeholder"></div>

            <div className="stats-container">
                <h3 className="stats-title">Statistiques de ma collection</h3>

                <div className="stats-dashboard-layout">
                     <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-number">{stats.albumsSauvegardes}</span>
                            <span className="stat-label">albums sauvegardés</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.albumTermines}</span>
                            <span className="stat-label">albums terminés</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.albumEnCours}</span>
                            <span className="stat-label">En cours d'écoute</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.playlistsCrees}</span>
                            <span className="stat-label">playlists créées</span>
                        </div>
                    </div>

                    {hasAlbum ? (
                        <div className="stats-donut-wrapper">
                            <h4 className="stats-breakdown-title">Répartition par statut</h4>
                            <div className="stats-donut-chart">
                                <Doughnut data={donutData} options={donutOptions} />
                            </div>
                        </div>
                    ) : (
                        <div className='stats-donut-wrapper'>
                            <p className="stats-empty">Ajoutez des albums à votre bibliothèque pour voir vos statistiques.</p>
                        </div>
                    )}
                </div>
            </div>

            <Carousel title="Ajouté récemment">
                {userAlbums.slice(0, 10).map(album => (
                    <AlbumCard key={`recent-a-${album.id}`} album={album.album || album} />
                ))}
                {userPlaylists.slice(0,10).map(playlist => (
                    <PlaylistCard key={`recent-p-${playlist.id}`} playlist={playlist} onPlaylistUpdated={handlePlaylistStatusChange}/>
                ))}
            </Carousel>

            <Carousel title="Albums préférés" onSeeAll={() => navigate('/library/albums')}>
                {userAlbums.map(item => {
                    const albumData = item.album || item;
                    return <AlbumCard key={`album-${albumData.id}`} album={albumData} />
                })}
            </Carousel>

            <Carousel title="Playlist préférées" onSeeAll={() => navigate('/library/playlists')}>
                {userPlaylists
                    .filter(item => item.playlist ? item.playlist.is_favorite : item.is_favorite)
                    .map(item => {
                        const playlistData = item.playlist || item;
                        return <PlaylistCard key={`pref-${playlistData.id}`} playlist={playlistData} onPlaylistUpdated={handlePlaylistStatusChange}/>
                    })
                }
            </Carousel>

            <Carousel title="Playlist personnalisées" onSeeAll={() => navigate('/library/playlists')}>
                <div className="static-card create-card carousel-static" onClick={() => setIsModalOpen(true)}>
                    <div className="static-cover create-cover">
                        <span className="plus-icon">+</span>
                    </div>
                    <h4 className="static-title">Créer une nouvelle playlist</h4>
                </div>

                <div className="static-card favorite-card carousel-static">
                    <div className="static-cover favorites-cover">
                        <span className="heart-icon">♥</span>
                    </div>
                    <h4 className="static-title">Musique favorites</h4>
                    <p className="static-meta">{stats.favoriteTracks} musiques</p>
                </div>

                {userPlaylists.map(playlist => ( 
                    <PlaylistCard key={`custom-${playlist.id}`} playlist={playlist} onPlaylistUpdated={handlePlaylistStatusChange}/>
                ))}
            </Carousel>

            <CreatePlaylistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onPlaylistCreated={handlePlaylistCreated} />
        </div>
    );
}