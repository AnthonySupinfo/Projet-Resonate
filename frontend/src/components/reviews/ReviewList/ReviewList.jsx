import { useState, useEffect } from 'react';
import { getAlbumReviews } from '../../../api/api';
import { useAuth } from '../../../context/AuthContext';
import ReviewForm from './ReviewForm/ReviewForm';
import ReviewCard from './ReviewCard/ReviewCard';
import './ReviewList.css';

export default function ReviewList({ albumId }) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReviews = async () => {
            if(!albumId) return;
            setIsLoading(true);
            try {
                const data = await getAlbumReviews(albumId, 1);
                setReviews(data);
            } catch (error) {
                console.error("Erreur du chargement des critiques", error);
                setError("Impossible de charger les critiques");
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
    }, [albumId]);

    const handleReviewAdded = (newReview) => {
        setReviews([newReview, ...reviews]);
    };

    const handleReviewDeleted = (deletedId) => {
        setReviews(reviews.filter(r => r.id !== deletedId));
    };

    return (
        <div className="reviews-list-wrapper">
            <h2 className="section-title">Critiques de la communauté</h2>

            {user ? ( 
                <ReviewForm albumId={albumId} onReviewAdded={handleReviewAdded} />
            ) : (
                <div className="no-review-form">Connectez-vous pour écrire une critique.</div>
            )}

            <div className="reviews-feed">
                {isLoading ? (
                    <p className="review-loading">Chargement des critiques...</p>
                ) : error ? (
                    <p className="review-loading-error">{error}</p>
                ) : reviews.length === 0 ? (
                    <p className="no-review">Aucune critique pour cet album. Soyez le premier !</p>
                ) : (
                    reviews.map((reviews) => (
                        <ReviewCard key={reviews.id} review={reviews} onReviewDeleted={handleReviewDeleted}/>
                    ))
                )}
            </div>
        </div>
    )
}