import { Outlet } from "react-router-dom";
import LogoCard from "../../Shared/LogoCard/LogoCard.jsx";
import NavCard from "../../Shared/NavCard/NavCard.jsx";
import LanguageSwitch from "../../Shared/LanguageSwitch/LanguageSwitch.jsx";
import './AuthLayout.css';

export default function AuthLayout() {
    return (
        <div className="auth-layout">
            <aside>
                <LogoCard />
                <NavCard />
                <LanguageSwitch />
            </aside>

            <main className="auth-content">
                <Outlet />
            </main>
        </div>
    );
}