import './HeaderCard.css';
// import SearchBar from "../../Shared/SearchBar/SearchBar.jsx";

export default function HeaderCard() {
    return (
        <div className="header-card">
            <img
                src="/imagineDragons.jpg"
                alt="Imagine Dragons"
                className="header-bg-image"
            />

            {/*à remplacer par la vraie barre de recherche :*/}
            <div className="search-placeholder">
                <span className="search-icon">🔍</span>
                Que voulez-vous écouter ?
            </div>

            <div className="header-info">
                <h2 className="header-title">Birds</h2>
                <p className="header-subtitle">Imagine Dragons • Origins • Nov. 2018</p>
            </div>
        </div>
    )
}