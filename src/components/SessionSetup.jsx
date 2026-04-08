import React, { useState, useRef, useEffect } from 'react';
import './SessionSetup.css';

export default function SessionSetup({ onStart }) {
    const [focusMinutes, setFocusMinutes] = useState(25);
    const [restMinutes, setRestMinutes] = useState(5);
    const [cycles, setCycles] = useState(4);
    const [activeMode, setActiveMode] = useState('focus'); // 'focus' | 'rest'

    const circleRef = useRef(null);
    const isDragging = useRef(false);

    // Circle config
    const radius = 100;
    const center = 120; // 240x240 svg

    const handlePointerDown = (e) => {
        isDragging.current = true;
        updateValueFromEvent(e);
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current) return;
        updateValueFromEvent(e);
    };

    const handlePointerUp = () => {
        isDragging.current = false;
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
    };

    const updateValueFromEvent = (e) => {
        if (!circleRef.current) return;
        const rect = circleRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : null);
        const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : null);

        if (clientX == null || clientY == null) return;

        let angle = Math.atan2(clientY - centerY, clientX - centerX);
        let deg = (angle * 180) / Math.PI;
        deg += 90; // Rotate so top is 0
        if (deg < 0) deg += 360;

        const maxVal = activeMode === 'focus' ? 60 : 30;
        let val = Math.round((deg / 360) * maxVal);
        if (val === 0) val = maxVal;

        if (activeMode === 'focus') {
            setFocusMinutes(val);
        } else {
            setRestMinutes(val);
        }
    };

    const getKnobAngle = () => {
        const val = activeMode === 'focus' ? focusMinutes : restMinutes;
        const maxVal = activeMode === 'focus' ? 60 : 30;
        const deg = (val / maxVal) * 360;
        const rad = (deg - 90) * (Math.PI / 180);
        const x = center + radius * Math.cos(rad);
        const y = center + radius * Math.sin(rad);
        return { x, y, val, maxVal };
    };

    const knobState = getKnobAngle();

    return (
        <div className="session-setup" id="session-setup">
            <div className="dial-container">
                <svg width="240" height="240" ref={circleRef} className="dial-svg">
                    <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(32, 44, 99, 0.1)" strokeWidth="6" />

                    <path
                        d={`M ${center} ${center - radius} A ${radius} ${radius} 0 ${(knobState.val / knobState.maxVal * 360) > 180 ? 1 : 0
                            } 1 ${knobState.x} ${knobState.y}`}
                        fill="none"
                        stroke="#df77ac"
                        strokeWidth="6"
                    />

                    <line x1="40" y1={center} x2="200" y2={center} stroke="rgba(32, 44, 99, 0.1)" strokeWidth="2" />
                </svg>

                <div className="dial-overlay">
                    <button
                        className={`dial-half top-half-btn ${activeMode === 'focus' ? 'active-half' : ''}`}
                        onClick={() => setActiveMode('focus')}
                    >
                        <span className="dial-val">{focusMinutes} 분</span>
                        <span className="dial-label">focus</span>
                    </button>
                    <button
                        className={`dial-half bottom-half-btn ${activeMode === 'rest' ? 'active-half' : ''}`}
                        onClick={() => setActiveMode('rest')}
                    >
                        <span className="dial-label">rest</span>
                        <span className="dial-val">{restMinutes} 분</span>
                    </button>
                </div>

                <div
                    className="dial-knob"
                    style={{ left: knobState.x, top: knobState.y }}
                    onPointerDown={handlePointerDown}
                />
            </div>

            {/* Cycles Config */}
            <div className="cycles-config">
                <button className="cycle-adj-btn" onClick={() => setCycles(Math.max(1, cycles - 1))}>−</button>
                <div className="cycles-dots">
                    {Array.from({ length: cycles }).map((_, i) => (
                        <div key={i} className="cycle-dot"></div>
                    ))}
                </div>
                <button className="cycle-adj-btn" onClick={() => setCycles(Math.min(8, cycles + 1))}>+</button>
            </div>

            <button
                className="start-btn"
                onClick={() => onStart(cycles, focusMinutes, restMinutes)}
                id="start-session-btn"
            >
                시작하기
            </button>
        </div>
    );
}
