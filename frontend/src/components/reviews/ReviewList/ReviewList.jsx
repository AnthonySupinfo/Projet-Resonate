import { useState, useEffect } from 'react';
import { getAlbumReviews } from '../../../api/api';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import ReviewForm from '../ReviewForm/ReviewForm';
import ReviewCard from '../ReviewCard/ReviewCard';
import './ReviewList.css';

export default function ReviewList({ albumId, onReviewUpdated }) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const uid = user?.user_id || user?.id;

    useEffect(() => {
        if (!albumId) return;

        const fetchReviews = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await getAlbumReviews(albumId, 1);
                setReviews(data);

            } catch (error) {
                console.error("Erreur du chargement des critiques", error);
                setError(t('album.errorLoadReviews'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, [albumId]);

    const myReview = uid
        ? reviews.find(r => String(r.user_id) === String(uid))
        : null;

    const handleReviewAdded = (newReview) => {
        setReviews(prev =>
            prev.some(r => r.id === newReview.id)
                ? prev.map(r => r.id === newReview.id ? newReview : r)
                : [newReview, ...prev]
        );
        if (onReviewUpdated) setTimeout(onReviewUpdated, 500);
    };

    const handleReviewDeleted = (deletedId) => {
        setReviews(reviews.filter(r => r.id !== deletedId));
        if (onReviewUpdated) setTimeout(onReviewUpdated, 500);
    };

    const handleReviewUpdated = (updatedReview) => {
        setReviews(prev =>
            prev.map(r =>
                r.id === updatedReview.id ? updatedReview : r
            )
        );
        if (onReviewUpdated) setTimeout(onReviewUpdated, 500);
    };

    return (
        <div className="reviews-list-wrapper">
            <h2 className="section-title">{t('album.communityReviewsTitle')}</h2>

            {uid && (
                <ReviewForm
                    albumId={albumId}
                    onReviewAdded={handleReviewAdded}
                    existingReview={myReview}
                />
            )}

            <div className="reviews-feed">
                {isLoading ? (
                    <p className="review-loading">
                        {t('album.loadingReviews')}
                    </p>
                ) : error ? (
                    <p className="review-loading-error">{error}</p>
                ) : reviews.length === 0 ? (
                    <p className="no-review">
                        {t('album.noReviewsYet')}
                    </p>
                ) : (
                    reviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            onReviewDeleted={handleReviewDeleted}
                            onReviewUpdated={handleReviewUpdated}
                        />
                    ))
                )}
            </div>
        </div>
    );
}