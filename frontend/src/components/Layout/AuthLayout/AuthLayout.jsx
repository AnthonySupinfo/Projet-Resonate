import { Outlet } from "react-router-dom";
import NavCard from "../../Shared/NavCard/NavCard";
import LibraryCard from "../../library/libraryCard/LibraryCard";
import FavoritePlaylistCard from "../../Shared/FavoritePlaylistCard/FavoritePlaylistCard";
import './AuthLayout.css';

export default function AuthLayout() {
    return (
        <div className="auth-layout-container">
            {/*Mettre ici la user card + nav card + librairie card*/}
            {/*<header>Resonate - Bienvenue (version user connecté)</header>*/}

            <aside className="auth-sidebar">
                <NavCard />
                <LibraryCard />
            </aside>

            <main className="auth-main-content">
                <Outlet />
            </main>

            <aside className="auth-sidebar-right">
                <FavoritePlaylistCard/>
            </aside>
        </div>
    );
}