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
import { useLanguage } from '../context/LanguageContext.jsx';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function LibraryPage() {
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [userAlbums, setUserAlbums] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const favorites = userPlaylists.find(p =>
        p.playlist ? p.playlist.is_favorite : p.is_favorite
    );
    const { t } = useLanguage();

    const [stats, setStats] = useState({
        albumsSauvegardes: 0,
        albumTermines: 0,
        albumEnCours: 0,
        albumPlanned: 0,
        albumDropped: 0,
        playlistsCrees: 0,
        favoriteTracks: 0
    });

    const fetchUserData = useCallback(async () => {
        try {
            const [playlistData, libraryData] = await Promise.all([
                getMyPlaylist(),
                getMyLibrary()
            ]);

            setUserPlaylists(playlistData.length > 0 ? playlistData : []);
            setUserAlbums(libraryData.length > 0 ? libraryData : []);

            setStats({
                albumsSauvegardes: libraryData.length,
                albumTermines: libraryData.filter (item => item.status === 'COMPLETED').length,
                albumEnCours: libraryData.filter (item => item.status === 'LISTENING').length,
                albumPlanned: libraryData.filter (item => item.status === 'PLANNED').length,
                albumDropped: libraryData.filter (item => item.status === 'DROPPED').length,
                playlistsCrees: playlistData.length,
                favoriteTracks: 0
            });
        } catch (error) {
            console.error("Erreur lors de la récupération des données", error);
            setUserPlaylists([]);
            setUserAlbums([]);
            setStats({ albumsSauvegardes: 0, albumTermines: 0, albumEnCours: 0, albumPlanned: 0, albumDropped: 0, playlistsCrees: 0, favoriteTracks: 0 });
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
        window.dispatchEvent(new Event("playlistUpdated"));
    };

    const hasAlbum = stats.albumsSauvegardes > 0;

    const donutData = {
        labels: [
            t('library.statusCompleted'),
            t('library.statusListening'),
            t('library.statusPlanned'),
            t('library.statusDropped')
        ],
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
                        const tooltipText = val > 1 ? t('library.albumTooltipPlural') : t('library.albumTooltipSingular');
                        return ` ${val} ${tooltipText} (${pct}%)`;
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
                <h3 className="stats-title">{t('library.statsTitle')}</h3>

                <div className="stats-dashboard-layout">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-number">{stats.albumsSauvegardes}</span>
                            <span className="stat-label">{t('library.savedAlbums')}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.albumTermines}</span>
                            <span className="stat-label">{t('library.completedAlbums')}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.albumEnCours}</span>
                            <span className="stat-label">{t('library.listeningAlbums')}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.playlistsCrees}</span>
                            <span className="stat-label">{t('library.createdPlaylists')}</span>
                        </div>
                    </div>

                    {hasAlbum ? (
                        <div className="stats-donut-wrapper">
                            <h4 className="stats-breakdown-title">{t('library.statusBreakdown')}</h4>
                            <div className="stats-donut-chart">
                                <Doughnut data={donutData} options={donutOptions} />
                            </div>
                        </div>
                    ) : (
                        <div className='stats-donut-wrapper'>
                            <p className="stats-empty">{t('library.emptyStats')}</p>
                        </div>
                    )}
                </div>
            </div>

            <Carousel title={t('library.recentlyAdded')}>
                {userAlbums.slice(0, 10).map(album => (
                    <AlbumCard key={`recent-a-${album.id}`} album={album.album || album} />
                ))}
                {userPlaylists.slice(0,10).map(playlist => (
                    <PlaylistCard key={`recent-p-${playlist.id}`} playlist={playlist} onPlaylistUpdated={handlePlaylistStatusChange}/>
                ))}
            </Carousel>

            <Carousel title={t('library.favoriteAlbums')} onSeeAll={() => navigate('/library/albums')}>
                {userAlbums.map(item => {
                    const albumData = item.album || item;
                    return <AlbumCard key={`album-${albumData.id}`} album={albumData} />
                })}
            </Carousel>

            <Carousel title={t('library.favoritePlaylists')} onSeeAll={() => navigate('/library/playlists')}>
                {userPlaylists
                    .filter(item => item.playlist ? item.playlist.is_favorite : item.is_favorite)
                    .map(item => {
                        const playlistData = item.playlist || item;
                        return <PlaylistCard key={`pref-${playlistData.id}`} playlist={playlistData} onPlaylistUpdated={handlePlaylistStatusChange}/>
                    })
                }
            </Carousel>

            <Carousel title={t('library.customPlaylists')} onSeeAll={() => navigate('/library/playlists')}>
                <div className="static-card create-card carousel-static" onClick={() => setIsModalOpen(true)}>
                    <div className="static-cover create-cover">
                        <span className="plus-icon">+</span>
                    </div>
                    <h4 className="static-title">{t('library.createNewPlaylist')}</h4>
                </div>

                {/*
                <div className="static-card favorite-card carousel-static">
                    <div className="static-cover favorites-cover">
                        <span className="heart-icon">♥</span>
                    </div>
                    <h4 className="static-title">{t('library.favoriteTracks')}</h4>
                    <p className="static-meta">{stats.favoriteTracks} {t('library.tracksCount')}</p>
                </div>
                */}

                {favorites && (
                    <PlaylistCard playlist={favorites} />
                )}
                {userPlaylists
                    .filter(p => !(p.playlist ? p.playlist.is_favorite : p.is_favorite))
                    .map(playlist => (
                        <PlaylistCard
                            key={`custom-${playlist.id}`}
                            playlist={playlist}
                            onPlaylistUpdated={handlePlaylistStatusChange}
                        />
                    ))
                }
            </Carousel>

            <CreatePlaylistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onPlaylistCreated={handlePlaylistCreated} />
        </div>
    );
}