import "./AlbumCard.css";

export default function AlbumCard({ album }) {

    if (!album) return null;

    const title = album.name || album.title || "Titre inconnu";
    const artist = album.artist_name || album.artist || "Artiste inconnu";
    const coverUrl = album.image_url || album.cover_url || album.coverUrl || `https://placehold.co/400x400/2a2a2c/ffffff?text=${encodeURIComponent(title)}`;

    return (
        <div className="album-card">
            <div className="album-cover-wrapper">
                <img
                    src={coverUrl}
                    alt={title}
                    className="album-cover"
                />
            </div>
            <h4 className="album-title">{title}</h4>
            <p className="album-meta">{artist} • {album.year}</p>
        </div>
    );
}

