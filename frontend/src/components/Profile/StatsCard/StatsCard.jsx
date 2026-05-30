import { useState, useEffect } from 'react';
import { useAuth } from "../../../context/AuthContext.jsx";
import { getUserStats } from "../../../api/auth.js";
import './StatsCard.css';

export default function StatsCard() {
    const { user } = useAuth();

    const [stats, setStats] = useState({
        liked_albums_count: 0,
        reviews_count: 0,
        comments_count: 0,
        listening_minutes: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (user?.id) {
                try {
                    const data = await getUserStats(user.id);
                    if (data) {
                        setStats(data);
                    }
                } catch (err) {
                    console.error("Erreur lors de la récupération des statistiques de la page profil", err);
                }
            }
        };

        fetchStats();
    }, [user?.id]);

    return (
        <div className="stats-card-container">
            <h2 className="stats-card-title">Statistiques</h2>

            <div className="stats-row">
                <div className="stat-block">
                    <span className="stat-value">{stats.liked_albums_count || 0}</span>
                    <span className="stat-name">albums<br/>aimés</span>
                </div>

                <div className="stat-block">
                    <span className="stat-value">{stats.reviews_count || 0}</span>
                    <span className="stat-name">notations<br/>données</span>
                </div>

                <div className="stat-block">
                    <span className="stat-value">{stats.comments_count || 0}</span>
                    <span className="stat-name">commentaires<br/>laissés</span>
                </div>

                <div className="stat-block">
                    <span className="stat-value">{stats.listening_minutes || 0}</span>
                    <span className="stat-name">minutes<br/>d'écoute</span>
                </div>
            </div>
        </div>
    );
}