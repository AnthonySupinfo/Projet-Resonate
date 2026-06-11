import { useState, useEffect } from 'react';
import './HeaderCard.css';
import SearchBar from "../../Shared/SearchBar/SearchBar.jsx";
import { getRandomTrack, getProxyImageUrl } from "../../../api/api.js";

export default function HeaderCard() {
    const [randomTrack, setRandomTrack] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchTrack = async (isInitial) => {
            if (isInitial) setLoading(true);
            try {
                const data = await getRandomTrack();
                if (isMounted) setRandomTrack(data);
            } catch (error) {
                console.error("Erreur lors de la récupération de la musique :", error);
            } finally {
                if (isMounted && isInitial) setLoading(false);
            }
        };

        fetchTrack(true);

        const intervalId = setInterval(() => {
            fetchTrack(false);
        }, 5000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div className="header-card">
            {loading && <div className="header-bg-image header-bg-loading" />}

            {randomTrack && !loading && (
                <>
                    <img
                        key={randomTrack.track_name + randomTrack.album_name}
                        src={getProxyImageUrl(randomTrack.image)}
                        alt={randomTrack.album_name}
                        className="header-bg-image"
                        onError={(e) => { e.target.src = "/fallback.jpg"; }}
                    />

                    <SearchBar />

                    <div className="header-info" key={`info-${randomTrack.track_name}`}>
                        <h2 className="header-title">{randomTrack.track_name}</h2>
                        <p className="header-subtitle">
                            {randomTrack.artist} • {randomTrack.album_name} {randomTrack.year ? `• ${randomTrack.year}` : ''}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}