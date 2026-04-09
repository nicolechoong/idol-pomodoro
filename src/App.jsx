import React, { useState, useCallback, useEffect, useRef } from 'react';
import Pet from './components/Pet.jsx';
import Timer from './components/Timer.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import SessionSetup from './components/SessionSetup.jsx';
import { usePomodoro } from './hooks/usePomodoro.js';
import { useNotification } from './hooks/useNotification.js';
import { useWakeLock } from './hooks/useWakeLock.js';
import { saveSession, updatePetMood, incrementSessions } from './db.js';
import {
    SESSION_COMPLETE,
    DISAPPOINTED,
    BREAK_START,
    WORK_START,
    getRandomDialogue,
} from './constants/dialogue.js';
import './App.css';

export default function App() {
    const pomo = usePomodoro();
    const { requestPermission } = useNotification(pomo.phase, pomo.remainingMs, pomo.phaseDuration);

    const isActive = pomo.phase === 'WORK' || pomo.phase === 'BREAK';
    useWakeLock(isActive);

    const [petMood, setPetMood] = useState('idle');
    const [bubbleText, setBubbleText] = useState('');
    const [showBubble, setShowBubble] = useState(false);
    const [sessionDone, setSessionDone] = useState(false);

    const prevPhaseRef = useRef('IDLE');
    const sessionStartRef = useRef(null);

    // Show a speech bubble temporarily
    const speechSequenceIdRef = useRef(0);

    const showSpeech = useCallback((textInput, duration = 3000, isPersistent = false) => {
        const texts = Array.isArray(textInput) ? textInput : [textInput];
        const seqId = ++speechSequenceIdRef.current;

        const runSequence = async () => {
            for (let i = 0; i < texts.length; i++) {
                if (speechSequenceIdRef.current !== seqId) break;
                setBubbleText(texts[i]);
                setShowBubble(true);

                if (isPersistent && i === texts.length - 1) {
                    return; // Stay on screen indefinitely
                }

                await new Promise((res) => setTimeout(res, duration));
            }
            if (speechSequenceIdRef.current === seqId) {
                setShowBubble(false);
            }
        };

        runSequence();
    }, []);

    // Handle phase transitions
    useEffect(() => {
        const prev = prevPhaseRef.current;
        const curr = pomo.phase;
        prevPhaseRef.current = curr;

        if (prev === curr) return;

        if (curr === 'WORK' && prev === 'IDLE') {
            // Session started
            setPetMood('practicing');
            showSpeech(getRandomDialogue(WORK_START));
        } else if (curr === 'WORK' && prev === 'BREAK') {
            // Back to work after break
            setPetMood('practicing');
            showSpeech(getRandomDialogue(WORK_START));
        } else if (curr === 'BREAK') {
            // Break started
            setPetMood('idle');
            showSpeech(getRandomDialogue(BREAK_START));
        } else if (curr === 'DONE') {
            // Session complete!
            setPetMood('happy');
            showSpeech(getRandomDialogue(SESSION_COMPLETE), 3000, true);
            setSessionDone(true);

            // Persist
            incrementSessions();
            updatePetMood('happy');
            if (sessionStartRef.current) {
                saveSession({
                    startTime: sessionStartRef.current,
                    endTime: Date.now(),
                    cyclesPlanned: pomo.totalCycles,
                    cyclesCompleted: pomo.totalCycles,
                    status: 'completed',
                });
            }
        }
    }, [pomo.phase, showSpeech]);

    // Start session handler
    const handleStart = useCallback((cycles, focusMin, restMin) => {
        requestPermission();
        sessionStartRef.current = Date.now();
        setSessionDone(false);
        pomo.start(cycles, focusMin, restMin);
    }, [pomo, requestPermission]);

    // Reset handler
    const handleReset = useCallback(() => {
        const endedEarly = pomo.phase === 'WORK' || pomo.phase === 'BREAK';
        pomo.reset();
        setBubbleText('');
        setShowBubble(false);
        setSessionDone(false);

        if (endedEarly) {
            setPetMood('disappointed');
            updatePetMood('disappointed');
            showSpeech(getRandomDialogue(DISAPPOINTED), 3000, true);
        } else {
            setPetMood('idle');
            updatePetMood('idle');
        }
    }, [pomo, showSpeech]);

    const bgClass = pomo.phase === 'WORK' ? 'bg-work' :
        pomo.phase === 'BREAK' ? 'bg-break' : 'bg-idle';

    return (
        <div className={`app ${bgClass}`}>
            {isActive || pomo.phase === 'DONE' ? (
                <div className="top-progress-bar">
                    <ProgressBar
                        progress={pomo.overallProgress}
                        currentCycle={pomo.currentCycle}
                        totalCycles={pomo.totalCycles}
                        phase={pomo.phase}
                        remainingMs={pomo.remainingMs}
                        phaseDuration={pomo.phaseDuration}
                        workDuration={pomo.workDuration}
                        breakDuration={pomo.breakDuration}
                    />
                </div>
            ) : null}

            <main className="app-main">
                <div className="top-half">
                    {isActive ? (
                        <div className="timer-wrapper">
                            <Timer
                                remainingMs={pomo.remainingMs}
                                phaseDuration={pomo.phaseDuration}
                                phase={pomo.phase}
                            />
                        </div>
                    ) : pomo.phase === 'DONE' ? (
                        <div className="done-section">
                            <p className="done-text">Practice complete! ✨</p>
                            <button className="start-btn" onClick={handleReset} id="new-session-btn">
                                New Session 🎵
                            </button>
                        </div>
                    ) : (
                        <SessionSetup onStart={handleStart} />
                    )}
                </div>

                <div className="studio-background">
                    <Pet
                        mood={petMood}
                        showBubble={showBubble}
                        bubbleText={bubbleText}
                    />

                    {isActive && (
                        <div className="bottom-controls">
                            <button className="cancel-btn" onClick={handleReset} id="cancel-btn">
                                End Session
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
