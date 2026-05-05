import "./AlbumCard.css";

export default function AlbumCard({ album }) {
    return (
        <div className="album-card">
            <div className="album-cover-wrapper">
                <img
                    src={album.coverUrl || "https://placehold.co/400x400/2a2a2c/ffffff?text=Album"}
                    alt={album.title}
                    className="album-cover"
                />
            </div>
            <h4 className="album-title">{album.title}</h4>
            <p className="album-meta">{album.artist} • {album.year}</p>
        </div>
    );
}

