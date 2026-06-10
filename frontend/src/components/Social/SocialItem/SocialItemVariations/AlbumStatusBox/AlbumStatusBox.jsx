import { Link } from 'react-router-dom';
import './AlbumStatusBox.css';

export default function AlbumStatusBox({ activity }) {
    const { target } = activity;

    const safeArtist = target?.artist ? encodeURIComponent(target.artist) : "inconnu";
    const safeAlbum = target?.albumTitle ? encodeURIComponent(target.albumTitle) : "inconnu";
    const albumRoute = `/albums/${safeArtist}/${safeAlbum}`;

    return (
        <div className="social-item-album-box">
            <Link to={albumRoute}>
                <img
                    src={target.coverUrl || "https://placehold.co/64x64/222/FFF?text=?"}
                    alt="Album Cover"
                    className="social-album-cover"
                />
            </Link>

            <div className="social-album-info">
                <h4 className="social-album-title">
                    <Link to={albumRoute} className="social-album-link">
                        {target.albumTitle}
                    </Link>
                </h4>

                <p className="social-album-meta">
                    {target.artist}
                </p>
            </div>
        </div>
    );
}