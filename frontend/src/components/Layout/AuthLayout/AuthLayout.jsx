import { Outlet } from "react-router-dom";
import './AuthLayout.css';
import NavCard from "../../Shared/NavCard/NavCard.jsx";
import LanguageSwitch from "../../Shared/LanguageSwitch/LanguageSwitch.jsx";

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