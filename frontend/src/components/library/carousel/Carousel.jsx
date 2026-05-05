import { useRef } from 'react';
import './Carousel.css';

export default function Carousel({ title, children }) {
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
                <div className="carousel-actions">
                    <button className="carousel-arrow" onClick={() => scroll('left')}>←</button>
                    <button className="carousel-arrow" onClick={() => scroll('right')}>→</button>
                </div>
            </div>

            <div className="carousel-track" ref={scrollRef}>{children}</div>
        </div>
    );
}