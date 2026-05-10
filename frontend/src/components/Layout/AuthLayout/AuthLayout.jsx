import { Outlet } from "react-router-dom";
import './AuthLayout.css';
import NavCard from "../../Shared/NavCard/NavCard.jsx";

export default function AuthLayout() {
    return (
        <div className="auth-layout">
            <aside>
                <NavCard />
            </aside>

            <main className="auth-content">
                <Outlet />
            </main>
        </div>
    );
}