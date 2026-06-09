import "./AlbumCard.css";
import {useNavigate} from "react-router-dom";

export default function AlbumCard({ album }) {
    const navigate = useNavigate();

    if (!album) return null;

    const data = album.album || album;
    const title = data.name || data.title || "Titre inconnu";
    const artist = data.artist_name || data.artist || "Artiste inconnu";

    const coverUrl = data.image || data.image_url || `https://placehold.co/400x400/2a2a2c/ffffff?text=${encodeURIComponent(title[0])}`;

    return (
        <div className="album-card-a" onClick={() => navigate(`/albums/${encodeURIComponent(album.artist_name)}/${encodeURIComponent(album.name)}`)}>
            <div className="album-cover-wrapper-a">
                <img
                    src={coverUrl}
                    alt={title}
                    className="album-cover-a"
                />
            </div>
            <h4 className="album-title-a">{title}</h4>
            <p className="album-meta-a">{artist}</p>
        </div>
    );
}

