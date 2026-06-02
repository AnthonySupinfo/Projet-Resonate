import './HeaderCard.css';
import SearchBar from "../../Shared/SearchBar/SearchBar.jsx";

export default function HeaderCard() {
    return (
        <div className="header-card">
            <img
                src="/imagineDragons.jpg"
                alt="Imagine Dragons"
                className="header-bg-image"
            />

            {/* barre de recherche */}
            <SearchBar />

            <div className="header-info">
                <h2 className="header-title">Birds</h2>
                <p className="header-subtitle">Imagine Dragons • Origins • Nov. 2018</p>
            </div>
        </div>
    )
}