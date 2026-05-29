import { useState, useEffect } from 'react';
import './Social.css';
import SocialItem from "../../components/Social/SocialItem/SocialItem.jsx";
import {feedService} from "../../api/feed.service.js";

export default function Social() {
    const [feedData, setFeedData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                setIsLoading(true);
                const data = await feedService.getFeed();
                setFeedData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeed();
    }, []);

    return (
        <div className="social-container">
            <h2 className="social-title">Social</h2>

            <div className="social-feed-scroll-area">
                {isLoading && <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>}

                {error && <p style={{ color: 'var(--accent-primary)' }}>Erreur : {error}</p>}

                {!isLoading && !error && feedData.length === 0 && (
                    <p style={{ color: 'var(--text-muted)' }}>Aucune activité récente.</p>
                )}

                {!isLoading && !error && feedData.map((activity) => (
                    <SocialItem key={activity.id} activity={activity} />
                ))}
            </div>
        </div>
    );
}