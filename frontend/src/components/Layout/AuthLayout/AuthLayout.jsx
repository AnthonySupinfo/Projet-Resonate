import { Outlet } from "react-router-dom";
import './AuthLayout.css';
import NavCard from "../../Shared/NavCard/NavCard.jsx";
import UserCard from "../../Shared/UserCard/UserCard.jsx";
import LibraryCard from "../../library/libraryCard/LibraryCard.jsx";
import NotifsCard from "../../Shared/NotifsCard/NotifsCard.jsx";

export default function AuthLayout() {
    return (
        <div className="auth-layout">
            <aside>
                <UserCard />
                <NavCard />
                <LibraryCard />
            </aside>

            <main className="auth-content">
                <Outlet />
            </main>

            <aside>
                <NotifsCard/>
            {/*    Fav Playlist card  */}
            </aside>
        </div>
    );
}