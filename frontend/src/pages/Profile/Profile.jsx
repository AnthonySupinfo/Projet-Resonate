import './Profile.css';
import HeaderCard from "../../components/Profile/HeaderCard/HeaderCard.jsx";
import StatsCard from "../../components/Profile/StatsCard/StatsCard.jsx";
import PlaylistCard from "../../components/library/playlistCard/PlaylistCard.jsx";
import Carousel from "../../components/library/carousel/Carousel.jsx";
import { useNavigate } from 'react-router-dom';
import {useEffect, useState} from "react";
import {getMyLibrary, getMyPlaylist} from "../../api/api.js";
import AlbumCard from "../../components/library/albumCard/AlbumCard.jsx";

export default function Profile() {
    const navigate = useNavigate();
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [userAlbums, setUserAlbums] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [playlistsData, libraryData] = await Promise.all([
                    getMyPlaylist(),
                    getMyLibrary()
                ]);

                setUserPlaylists(playlistsData.length > 0 ? playlistsData : []);
                setUserAlbums(libraryData.length > 0 ? libraryData : []);
            } catch (error) {
                console.error("Erreur lors de la récupération des données", error);
            }
        };
        fetchUserData();
    }, []);

    return (
        <div className="profile-container">
            <HeaderCard />
            <StatsCard />

            {/*ToDo: Mettre la liste des derniers titres écoutés ici*/}

            <Carousel title="Albums préférés" onSeeAll={() => navigate('/library/albums')}>
                {userAlbums.map(item => {
                    const albumData = item.album || item;
                    return <AlbumCard key={`album-${albumData.id}`} album={albumData} />
                })}
            </Carousel>

            <Carousel title="Playlist préférées" onSeeAll={() => navigate('/library/playlists')}>
                {userPlaylists.map(item => {
                    const playlistData = item.playlist || item;
                    return <PlaylistCard key={`pref-${playlistData.id}`} playlist={playlistData} />
                })}
            </Carousel>

            <Carousel title="Playlist personnalisées" onSeeAll={() => navigate('/library/playlists')}>
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
                    {/*<p className="static-meta">{stats.favoriteTracks} musiques</p>*/}
                </div>

                {userPlaylists.map(playlist => (
                    <PlaylistCard key={`custom-${playlist.id}`} playlist={playlist} />
                ))}
            </Carousel>
        </div>
    );
}