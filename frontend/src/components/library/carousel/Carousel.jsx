import { useRef } from 'react';
import './Carousel.css';

export default function Carousel({ title, children, onSeeAll }) {
    const scrollRef = useRef(null); // useRef permet d'accéder direct à la div pour la scroller

    const scroll = (direction) => {
        if(scrollRef.current) {
            const scrollAmount = 400;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="carousel-section">
            <div className="carousel-header">
                <h2 className="carousel-title">{title}</h2>
            
                {onSeeAll && (
                    <button className="see-all-btn" onClick={onSeeAll}>Tout voir</button>
                )}
            </div>

            <div className="carousel-content-wrapper">
                <button className="carousel-arrow left" onClick={() => scroll('left')}>←</button>
                    <div className="carousel-track" ref={scrollRef}>{children}</div>
                    <button className="carousel-arrow right" onClick={() => scroll('right')}>→</button>
                </div>
            </div>
    );
}