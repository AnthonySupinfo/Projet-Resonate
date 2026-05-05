import "./PlaylistCard.css";

export default function PlaylistCard({ playlist }) {
    return (
        <div className="playlist-card">
            <div className="playlist-cover-wrapper">
                <img
                    src={playlist.coverUrl || "https://placehold.co/400x400/2a2a2c/ffffff?text=Playlist"}
                    alt={playlist.name}
                    className="playlist-cover"
                />
                {playlist.id && (
                    <span className={`playlist-badge ${playlist.is_public ? 'public' : 'private'}`}>
                        {playlist.is_public ? 'Public' : 'Privé'}
                    </span>
                )}
            </div>
            <h4 className="playlist-title">{playlist.name}</h4>
            <p className="playlist-meta">
                {playlist.trackCount ? `${playlist.trackCount} musiques`: 'Playlist personnalisées'}
            </p>
        </div>
    );
}