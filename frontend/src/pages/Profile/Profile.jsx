import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Carousel from '../../components/library/carousel/Carousel'
import PlaylistCard from '../../components/library/playlistCard/PlaylistCard';
import AlbumCard from '../../components/library/albumCard/AlbumCard';
import { getMyLibrary, getMyPlaylist } from '../../api/api';

import './Profile.css';
import HeaderCard from "../../components/Profile/HeaderCard/HeaderCard.jsx";
import StatsCard from "../../components/Profile/StatsCard/StatsCard.jsx";

export default function Profile() {
    const [recentAlbums, setRecentAlbums] = useState([]);
    const [favoritePlaylists, setFavoritePlaylists] = useState([]);
    const [customPlaylists, setCustomPlaylists] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();


    const fetchProfileContent = useCallback(async () => {
        try {
            const [libraryRes, playlistRes] = await Promise.all([
                getMyLibrary(),
                getMyPlaylist()
            ]);

            const sortedAlbum = [...libraryRes].sort((a, b) => {
                return new Date(b.updated_at) - new Date(a.updated_at);
            });

            setRecentAlbums(sortedAlbum.slice(0, 10));

            setFavoritePlaylists(playlistRes.filter(item => 
                item.playlist ? item.playlist.is_favorite : item.is_favorite
            ));

            setCustomPlaylists(playlistRes);

        } catch (error) {
            console.error ("Erreur lors de la récupération du contenu du profil", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfileContent();

        window.addEventListener("playlistUpdated", fetchProfileContent);
        window.addEventListener("favoriteChanged", fetchProfileContent);
        window.addEventListener("libraryUpdated", fetchProfileContent);

        return () => {
            window.removeEventListener("playlistUpdated", fetchProfileContent);
            window.removeEventListener("favoriteChanged", fetchProfileContent);
            window.removeEventListener("libraryUpdated", fetchProfileContent);
        };
    }, [fetchProfileContent]);

    const handlePlaylistStatusChange= (updatedPlaylist) => {
        setCustomPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
    };

    return (
        <div className="profile-container">
            <HeaderCard />
            <StatsCard />

            {!isLoading && recentAlbums.length > 0 && (
                <Carousel title="Albums récents">
                    {recentAlbums.map(item => {
                        const albumData = item.album || item;
                        return <AlbumCard key={`prof-a-${albumData.id}`} album={albumData} />;
                    })}
                </Carousel>
            )}

            {!isLoading && favoritePlaylists.length > 0 && (
                <Carousel title="Playlists préférées">
                    {favoritePlaylists.map(item => {
                        const playlistData = item.playlist || item;
                        return <PlaylistCard key={`prof-fav-p-${playlistData.id}`} playlist={playlistData} onPlaylistUpdated={handlePlaylistStatusChange} />
                    })}
                </Carousel>
            )}

            {!isLoading && customPlaylists.length > 0 && (
                <Carousel title="Playlists personnalisées" onSeeAll={() => navigate('/library/playlists')}>
                    {customPlaylists.map(item => {
                        const playlistData = item.playlist || item;
                        return <PlaylistCard key={`prof-custom-p-${playlistData.id}`} playlist={playlistData} onPlaylistUpdated={handlePlaylistStatusChange}/>
                    })}
                </Carousel>
            )}
        </div>
    );
}
