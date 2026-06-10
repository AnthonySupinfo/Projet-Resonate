import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Carousel from '../../components/library/carousel/Carousel'
import PlaylistCard from '../../components/library/playlistCard/PlaylistCard';
import AlbumCard from '../../components/library/albumCard/AlbumCard';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { getMyLibrary, getMyPlaylist, getUserLibrary, getUserPlaylists } from '../../api/api';
import { getUserProfile } from '../../api/auth.js';
import { useAuth } from '../../context/AuthContext.jsx';

import './Profile.css';
import HeaderCard from "../../components/Profile/HeaderCard/HeaderCard.jsx";
import StatsCard from "../../components/Profile/StatsCard/StatsCard.jsx";

export default function Profile() {
    const { id } = useParams();
    const { user } = useAuth();

    const isMyProfile = !id || (user && id === String(user.user_id || user.id));

    const [recentAlbums, setRecentAlbums] = useState([]);
    const [favoritePlaylists, setFavoritePlaylists] = useState([]);
    const [customPlaylists, setCustomPlaylists] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const navigate = useNavigate();
    const { t } = useLanguage();

    const fetchProfileContent = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);

        try {
            let libraryRes, playlistRes;

            if (isMyProfile) {
                [libraryRes, playlistRes] = await Promise.all([
                    getMyLibrary(),
                    getMyPlaylist()
                ]);
            } else {
                const [libraryResData, playlistResData, profileResData] = await Promise.all([
                    getUserLibrary(id),
                    getUserPlaylists(id),
                    getUserProfile(id)
                ]);

                if (!profileResData || profileResData.error) {
                    throw new Error("Utilisateur introuvable");
                }

                libraryRes = libraryResData;
                playlistRes = playlistResData;
            }

            const sortedAlbum = [...libraryRes].sort((a, b) => {
                return new Date(b.updated_at) - new Date(a.updated_at);
            });

            setRecentAlbums(sortedAlbum.slice(0, 10));

            setFavoritePlaylists(playlistRes.filter(item =>
                item.playlist ? item.playlist.is_favorite : item.is_favorite
            ));

            setCustomPlaylists(playlistRes);

        } catch (error) {
            console.error(error);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [id, isMyProfile]);

    useEffect(() => {
        fetchProfileContent();

        if (isMyProfile) {
            window.addEventListener("playlistUpdated", fetchProfileContent);
            window.addEventListener("favoriteChanged", fetchProfileContent);
            window.addEventListener("libraryUpdated", fetchProfileContent);

            return () => {
                window.removeEventListener("playlistUpdated", fetchProfileContent);
                window.removeEventListener("favoriteChanged", fetchProfileContent);
                window.removeEventListener("libraryUpdated", fetchProfileContent);
            };
        }

    }, [fetchProfileContent, isMyProfile]);

    const handlePlaylistStatusChange = (updatedPlaylist) => {
        if (!isMyProfile) return;
        setCustomPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
        setFavoritePlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
    };

    if (isLoading) {
        return (
            <div className="profile-loading-container">
                Chargement du profil...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="user-not-found-container">
                <h2>Utilisateur introuvable</h2>
                <p className="user-not-found-text">
                    Ce profil n'existe pas ou a été supprimé.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="back-home-btn"
                >
                    Retour à l'accueil
                </button>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <HeaderCard />
            <StatsCard />

            {recentAlbums.length > 0 && (
                <Carousel title={t('userProfile.recentAlbums')}>
                    {recentAlbums.map(item => {
                        const albumData = item.album || item;
                        return <AlbumCard key={`prof-a-${albumData.id}`} album={albumData} />;
                    })}
                </Carousel>
            )}

            {favoritePlaylists.length > 0 && (
                <Carousel title={t('userProfile.favoritePlaylists')}>
                    {favoritePlaylists.map(item => {
                        const playlistData = item.playlist || item;
                        return <PlaylistCard key={`prof-fav-p-${playlistData.id}`} playlist={playlistData} onPlaylistUpdated={handlePlaylistStatusChange} />
                    })}
                </Carousel>
            )}

            {customPlaylists.length > 0 && (
                <Carousel title={isMyProfile ? t('userProfile.customPlaylists') : t('userProfile.customPublicPlaylists')} onSeeAll={() => isMyProfile ? navigate('/library/playlists') : null}>
                    {customPlaylists.map(item => {
                        const playlistData = item.playlist || item;
                        return <PlaylistCard key={`prof-custom-p-${playlistData.id}`} playlist={playlistData} onPlaylistUpdated={handlePlaylistStatusChange}/>
                    })}
                </Carousel>
            )}
        </div>
    );
}