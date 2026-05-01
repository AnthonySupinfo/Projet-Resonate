import { Outlet } from "react-router-dom";

export default function GuestLayout() {
    return (
        <div className="guest-layout">
            {/*Mettre ici que la card logo + card nav + changement de langue*/}
            <header>Resonate - Bienvenue (version invité)</header>

            <main className="guest-content">
                <Outlet />
            </main>
        </div>
    );
}