import { useEffect, useState } from 'react';
import Carousel from '../components/library/carousel/Carousel'
import PlaylistCard from '../components/library/playlistCard/PlaylistCard';
import AlbumCard from '../components/library/albumCard/AlbumCard';
import './LibraryPage.css';
import { getMyLibrary, getMyPlaylist } from '../api/api';

// Données mockés pour tester visu 

const fallbackAlbums = [
    { id: 1, title: "BULLY", artist: "Kanye West", year: "2024", coverUrl: "https://placehold.co/400x400/2a2a2c/ffffff?text=BULLY"},
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
];

export default function LibraryPage() {
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [userAlbums, setUserAlbums] = useState([]);
    const [stats, setStats] = useState({
        likedAlbums: 0,
        followedPlaylists: 0,
        playlistCreated: 0,
        addedTracks: 0,
        favoriteTracks: 0
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [playlistsData, libraryData] = await Promise.all([
                    getMyPlaylist(),
                    getMyLibrary()
                ]);

                setUserPlaylists(playlistsData.length > 0 ? playlistsData : fallbackPlaylists);
                setUserAlbums(libraryData.length > 0 ? libraryData : fallbackAlbums);

                // Calcul des stats 
                const totalTracks = playlistsData.reduce((total, playlist) => total + (playlist.trackCount || 0), 0);

                setStats({
                    likedAlbums: libraryData.length,
                    followedPlaylists: playlistsData.length,
                    playlistCreated: playlistsData.length,
                    addedTracks: totalTracks > 0 ? totalTracks : 0,
                    favoriteTracks: 0 // à remplacer par await getMyFavoritesTracks().length
                });
            } catch (error) {
                console.error("Erreur lors de la récupération des données", error);
                setUserPlaylists(fallbackPlaylists); // fausse données si erreur de fetch
                setUserAlbums(fallbackAlbums);
                setStats({ likedAlbums: 0, followedPlaylists: 0, playlistCreated: 0, addedTracks: 0, favoriteTracks: 0 });
            }
        };
        fetchUserData();
    }, []);

    return (
        <div className="library-page-content">

            {/* à remplacer par la search bar codé par Krishna */}
            <div className="topbar-placeholder"></div>

            <div className="stats-container">
                <h3 className="stats-title">Statistiques</h3>
                <div className="stats-grid">
                    <div className="stat-item">
                        <span className="stat-number">{stats.likedAlbums}</span>
                        <span className="stat-label">albums aimés</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{stats.followedPlaylists}</span>
                        <span className="stat-label">playlists suivies</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{stats.playlistCreated}</span>
                        <span className="stat-label">Playlists créées</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{stats.addedTracks}</span>
                        <span className="stat-label">titres ajoutés</span>
                    </div>
                </div>
            </div>

            <Carousel title="Ajouté récemment">
                {userAlbums.slice(0, 2).map(album => (
                    <AlbumCard key={`recent-a-${album.id}`} album={album.album || album} />
                ))}
                {userPlaylists.slice(0, 2).map(playlist => (
                    <PlaylistCard key={`recent-p-${playlist.id}`} playlist={playlist} />
                ))}
            </Carousel>

            <Carousel title="Albums préférés">
                {userAlbums.map(item => {
                    const albumData = item.album || item;
                    return <AlbumCard key={`album-${albumData.id}`} album={albumData} />
                })}
            </Carousel>

            <Carousel title="Playlist préférées">
                {userPlaylists.map(item => {
                    const playlistData = item.playlist || item;
                    return <PlaylistCard key={`pref-${playlistData.id}`} playlist={playlistData} />
                })}
            </Carousel>

            <Carousel title="Playlist personnalisées">
                <div className="static-card create-card carousel-static">
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

                {userPlaylists.slice(0, 3).map(playlist => ( 
                    <PlaylistCard key={`custom-${playlist.id}`} playlist={playlist} />
                ))}
            </Carousel>
        </div>
    );
}