import { Outlet, useLocation } from "react-router-dom";
import FavoritePlaylistCard from "../../Shared/FavoritePlaylistCard/FavoritePlaylistCard";
import './AuthLayout.css';
import NavCard from "../../Shared/NavCard/NavCard.jsx";
import UserCard from "../../Shared/UserCard/UserCard.jsx";
import LibraryCard from "../../library/libraryCard/LibraryCard.jsx";
import NotifsCard from "../../Shared/NotifsCard/NotifsCard.jsx";
import ChatModal from "../../Shared/ChatModal/ChatModal.jsx";

export default function AuthLayout() {
    const location = useLocation();

    const isHomePage = location.pathname === '/';
    const hasRightSidebar = location.pathname === '/' || location.pathname === '/social';

    return (
        <div className={`auth-layout ${!hasRightSidebar ? 'profile-mode' : ''} ${isHomePage ? 'home-mode' : ''}`}>
            <aside className="left-sidebar">
                <UserCard />
                <NavCard />
                <LibraryCard />
            </aside>

            <div className="auth-topbar">
                {!isHomePage && (
                    <div className="search-placeholder">
                        🔍 Que voulez-vous écouter ?
                    </div>
                )}

                <div className="notifs-wrapper">
                    <NotifsCard />
                </div>
            </div>

            <main className="auth-content">
                <Outlet />
            </main>

            {hasRightSidebar && (
                <aside>
                    <FavoritePlaylistCard/>
                </aside>
            )}

            <ChatModal />
        </div>
    );
}