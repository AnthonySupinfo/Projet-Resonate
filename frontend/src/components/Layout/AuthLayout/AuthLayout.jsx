import {Outlet, useLocation} from "react-router-dom";
import './AuthLayout.css';
import NavCard from "../../Shared/NavCard/NavCard.jsx";
import UserCard from "../../Shared/UserCard/UserCard.jsx";
import LibraryCard from "../../library/libraryCard/LibraryCard.jsx";
import NotifsCard from "../../Shared/NotifsCard/NotifsCard.jsx";
// TODO: importer SearchBar
// import SearchBar from "../../Shared/SearchBar/SearchBar.jsx";

export default function AuthLayout() {
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const showFavPlaylist = location.pathname === '/' || location.pathname === '/social';
    const showRightSidebar = !isProfilePage;

    return (
        <div className={`auth-layout ${isProfilePage ? 'profile-mode' : ''}`}>
            <aside className="left-sidebar">
                <UserCard />
                <NavCard />
                <LibraryCard />
            </aside>

            <main className="auth-content">
                {!isHomePage && (
                    <div className="layout-topbar">
                        {/* <SearchBar /> */}
                        {/* ToDo: Placeholder à supprimer */}
                        <div style={{ opacity: 0.5, padding: '12px 24px', background: 'rgba(255,255,255,0.4)', borderRadius: '24px', width: '400px', marginTop: '5px' }}>
                            🔍 Que voulez-vous écouter ?
                        </div>
                    </div>
                )}

                <Outlet />
            </main>

            <aside>
                <NotifsCard/>

                {showFavPlaylist && (
                    <div className="fav-playlist-placeholder">
                        {/* <FavPlaylistCard /> */}
                    </div>
                )}
            </aside>
        </div>
    );
}