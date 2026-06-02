import { useState, useEffect } from 'react';
import './SocialCard.css';
import SocialItem from '../../Social/SocialItem/SocialItem.jsx';
import { feedService } from "../../../api/feed.service.js";
import {Link} from "react-router-dom";

export default function SocialCard() {
    const [feedData, setFeedData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                setIsLoading(true);
                const data = await feedService.getFeed();
                setFeedData(data);
            } catch (err) {
                console.error("Erreur lors de la récupération du feed", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeed();
    }, []);

    return (
        <div className="social-card-widget">
            <h2 className="social-card-title">
                <Link to="/social" className="social-card-link">Social</Link>
            </h2>

            <div className="social-card-scroll-area">
                {isLoading ? (
                    <p className="social-card-empty">Chargement des activités...</p>
                ) : feedData.length === 0 ? (
                    <p className="social-card-empty">Aucune activité récente.</p>
                ) : (
                    feedData.map((activity) => (
                        <SocialItem key={activity.id}
                                    activity={activity}
                                    hideComments={true}
                        />
                    ))
                )}
            </div>
        </div>
    );
}