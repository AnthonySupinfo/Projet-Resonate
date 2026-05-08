import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="auth-layout-container">
            {/*Mettre ici la user card + nav card + librairie card  */}
            <header>Resonate - Bienvenue (version user connecté)</header>

            <main className="auth-main-content">
                <Outlet />
            </main>
        </div>
    );
}