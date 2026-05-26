import "./PlaylistCard.css";
import { useNavigate } from "react-router-dom";

export default function PlaylistCard({ playlist }) {
    const navigate = useNavigate();
    if (!playlist) return null;

    const coverUrl = playlist.cover_url || playlist.coverUrl || `https://placehold.co/400x400/2a2a2c/ffffff?text=${encodeURIComponent(playlist.name)}`;

    const metaText = playlist.trackCount ? `${playlist.trackCount} musiques` : 'Playlist personnalisée';

    return (
        <div className="playlist-card" onClick={() => navigate(`/library/playlists/${playlist.id}`)}>
            <div className="playlist-cover-wrapper">
                <img
                    src={coverUrl}
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
            <p className="playlist-meta">{metaText}</p>
        </div>
    );
}