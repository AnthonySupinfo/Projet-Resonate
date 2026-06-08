import { useState, useEffect } from 'react';
import './SocialCard.css';
import SocialItem from '../../Social/SocialItem/SocialItem.jsx';
import { feedService } from "../../../api/feed.service.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import {Link} from "react-router-dom";

export default function SocialCard() {
    const [feedData, setFeedData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useLanguage();

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
                    <p className="social-card-empty">{t('social.loading')}</p>
                ) : feedData.length === 0 ? (
                    <p className="social-card-empty">{t('social.noActivity')}</p>
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