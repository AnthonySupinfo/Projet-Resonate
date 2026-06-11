import { useState, useEffect } from 'react';
import './Social.css';
import SocialItem from "../../components/Social/SocialItem/SocialItem.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { feedService } from "../../api/feed.service.js";
import { getProfile } from "../../api/auth.js";

export default function Social() {
    const [feedData, setFeedData] = useState([]);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [feed, profile] = await Promise.all([
                    feedService.getFeed(),
                    getProfile().catch(() => null)
                ]);

                setFeedData(feed);
                if (profile) setCurrentUserProfile(profile);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="social-container">
            <h2 className="social-title">Social</h2>

            <div className="social-feed-scroll-area">
                {isLoading && <p style={{ color: 'var(--text-muted)' }}>{t('social.loading')}</p>}

                {error && <p style={{ color: 'var(--accent-primary)' }}>{t('social.error')} {error}</p>}

                {!isLoading && !error && feedData.length === 0 && (
                    <p style={{ color: 'var(--text-muted)' }}>{t('social.noActivity')}</p>
                )}

                {!isLoading && !error && feedData.map((activity) => (
                    <SocialItem
                        key={activity.id}
                        activity={activity}
                        currentUserProfile={currentUserProfile}
                    />
                ))}
            </div>
        </div>
    );
}