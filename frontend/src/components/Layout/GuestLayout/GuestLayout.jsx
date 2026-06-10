import { Outlet } from "react-router-dom";
import './GuestLayout.css';
import LogoCard from "../../Shared/LogoCard/LogoCard.jsx";
import NavCard from "../../Shared/NavCard/NavCard.jsx";
import LanguageSwitch from "../../Shared/LanguageSwitch/LanguageSwitch.jsx";
import SearchBar from "../../Shared/SearchBar/SearchBar.jsx";

export default function GuestLayout() {
    return (
        <div className="guest-layout">
            <aside>
                <LogoCard />
                <NavCard />
                <LanguageSwitch />
            </aside>

            <main className="guest-content">
                <div className="guest-topbar">
                    <SearchBar />
                </div>
                <Outlet />
            </main>
        </div>
    );
}