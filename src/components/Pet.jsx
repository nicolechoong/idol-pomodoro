import React from 'react';
import './Pet.css';

const PET_IMAGES = {
    idle: 'idle.png',
    practicing: 'practicing.png',
    happy: 'happy.png',
    disappointed: 'disappointed.png',
    touched: 'touched.png',
};

export default function Pet({ mood = 'idle', showBubble, bubbleText, onTap }) {
    const basePath = import.meta.env.BASE_URL + 'pet/';
    const imgSrc = basePath + (PET_IMAGES[mood] || PET_IMAGES.idle);
    const animClass = mood === 'practicing' ? 'pet-bounce' :
        mood === 'happy' ? 'pet-celebrate' :
            mood === 'disappointed' ? 'pet-sad' : '';

    return (
        <div className="pet-container" onClick={onTap}>
            {showBubble && bubbleText && (
                <div className="speech-bubble" key={bubbleText}>
                    <p>{bubbleText}</p>
                    <div className="speech-bubble-tail" />
                </div>
            )}
            <div className={`pet-sprite ${animClass}`}>
                <img src={imgSrc} alt={`Idol trainee — ${mood}`} draggable={false} />
            </div>
        </div>
    );
}
