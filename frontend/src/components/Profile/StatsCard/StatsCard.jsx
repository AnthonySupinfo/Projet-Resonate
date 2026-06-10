import { useState, useEffect } from 'react';
import { useAuth } from "../../../context/AuthContext.jsx";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { getUserStats } from "../../../api/auth.js";
import './StatsCard.css';

export default function StatsCard({ userId }) {
    const { user } = useAuth();
    const { t } = useLanguage();

    const targetId = userId || user?.id;

    const [stats, setStats] = useState({
        in_progress_albums_count: 0,
        reviews_count: 0,
        comments_count: 0,
        listening_minutes: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (targetId) {
                try {
                    const data = await getUserStats(targetId);
                    if (data) {
                        setStats(data);
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        };

        fetchStats();
    }, [targetId]);

    return (
        <div className="stats-card-container">
            <h2 className="stats-card-title">{t('userProfile.statsTitle')}</h2>

            <div className="stats-row">
                <div className="stat-block">
                    <span className="stat-value">{stats.in_progress_albums_count || 0}</span>
                    <span className="stat-name">{t('userProfile.statAlbums')}<br/>{t('userProfile.statInProgress')}</span>
                </div>

                <div className="stat-block">
                    <span className="stat-value">{stats.reviews_count || 0}</span>
                    <span className="stat-name">{t('userProfile.statRatings')}<br/>{t('userProfile.statGiven')}</span>
                </div>

                <div className="stat-block">
                    <span className="stat-value">{stats.comments_count || 0}</span>
                    <span className="stat-name">{t('userProfile.statComments')}<br/>{t('userProfile.statLeft')}</span>
                </div>

                <div className="stat-block">
                    <span className="stat-value">{stats.listening_minutes || 0}</span>
                    <span className="stat-name">{t('userProfile.statMinutes')}<br/>{t('userProfile.statListening')}</span>
                </div>
            </div>
        </div>
    );
}