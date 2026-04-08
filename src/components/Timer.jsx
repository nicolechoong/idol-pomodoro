import React from 'react';
import './Timer.css';

export default function Timer({ remainingMs, phaseDuration, phase }) {
    const totalSec = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const progress = phaseDuration > 0 ? 1 - remainingMs / phaseDuration : 0;
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = Math.max(0, Math.min(circumference, circumference * (1 - progress)));

    const isWork = phase === 'WORK';
    const ringColor = isWork ? '#202c63' : '#df77ac';
    const label = isWork ? 'FOCUS' : 'BREAK';

    return (
        <div className="timer-container" id="timer-display">
            <svg className="timer-ring" viewBox="0 0 200 200">
                <circle
                    cx="100" cy="100" r={radius}
                    fill="none"
                    stroke="rgba(32, 44, 99, 0.1)"
                    strokeWidth="8"
                />
                <circle
                    cx="100" cy="100" r={radius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="timer-ring-progress"
                />
            </svg>
            <div className="timer-text">
                <span className="timer-label" style={{ color: ringColor }}>{label}</span>
                <span className="timer-digits">{display}</span>
            </div>
        </div>
    );
}
