import { useState, useEffect } from 'react';
import { getAlbumReviews } from '../../../api/api';
import { useAuth } from '../../../context/AuthContext';
import ReviewForm from '../ReviewForm/ReviewForm';
import ReviewCard from '../ReviewCard/ReviewCard';
import './ReviewList.css';

export default function ReviewList({ albumId, onReviewUpdated }) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const uid = user?.user_id || user?.id;

    
    
    useEffect(() => {
        if (!albumId) return;

        const fetchReviews = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await getAlbumReviews(albumId, 1);

                console.log("FETCH REVIEWS:", data);

                setReviews(data);

            } catch (error) {
                console.error("Erreur du chargement des critiques", error);
                setError("Impossible de charger les critiques");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, [albumId]); // important : user.id


    // trouver la review de l'user connecté
    const myReview = uid
        ? reviews.find(r => String(r.user_id) === String(uid))
        : null;



    // ajouter une review
    const handleReviewAdded = (newReview) => {
        setReviews(prev =>
            prev.some(r => r.id === newReview.id)
                ? prev.map(r => r.id === newReview.id ? newReview : r)
                : [newReview, ...prev]
        );
        if (onReviewUpdated) setTimeout(onReviewUpdated, 500);
    };

    // supprimer une review
    const handleReviewDeleted = (deletedId) => {
        setReviews(reviews.filter(r => r.id !== deletedId));
        if (onReviewUpdated) setTimeout(onReviewUpdated, 500);
    };

    const handleReviewUpdated = (updatedReview) => {
        console.log("UPDATE RECEIVED:", updatedReview);

        setReviews(prev =>
            prev.map(r =>
                r.id === updatedReview.id ? updatedReview : r
            )
        );
        if (onReviewUpdated) setTimeout(onReviewUpdated, 500);
    };

    return (
        <div className="reviews-list-wrapper">
            <h2 className="section-title">Critiques de la communauté</h2>

            {user === null ? (
                <div className="no-review-form">
                    Connectez-vous pour écrire une critique.
                </div>
            ) : !uid ? (
                <div className="no-review-form">
                    Chargement utilisateur...
                </div>
            ) : (
                <ReviewForm
                    albumId={albumId}
                    onReviewAdded={handleReviewAdded}
                    existingReview={myReview}
                />
            )}

            <div className="reviews-feed">
                {isLoading ? (
                    <p className="review-loading">
                        Chargement des critiques...
                    </p>
                ) : error ? (
                    <p className="review-loading-error">{error}</p>
                ) : reviews.length === 0 ? (
                    <p className="no-review">
                        Aucune critique pour cet album. Soyez le premier !
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