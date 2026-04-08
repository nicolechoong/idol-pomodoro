import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Detects when user leaves/returns using Page Visibility API and focus/blur.
 * Tracks whether user was absent during a focus phase.
 */
export function useLifecycle(phase, { onAppSwitch } = {}) {
    const [isVisible, setIsVisible] = useState(true);
    const [wasAbsentDuringFocus, setWasAbsentDuringFocus] = useState(false);

    const departureTimeRef = useRef(null);
    const phaseAtDepartureRef = useRef(null);
    const lastTouchTimeRef = useRef(Date.now());
    const onAppSwitchRef = useRef(onAppSwitch);

    useEffect(() => {
        onAppSwitchRef.current = onAppSwitch;
    }, [onAppSwitch]);

    // Track user's last interaction exactly as proposed
    useEffect(() => {
        const handleInteraction = () => { lastTouchTimeRef.current = Date.now(); };
        window.addEventListener('touchstart', handleInteraction, { passive: true });
        window.addEventListener('mousedown', handleInteraction, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('mousedown', handleInteraction);
        };
    }, []);

    const processDeparture = useCallback(() => {
        if (departureTimeRef.current) return; // Already departed

        const timeSinceLastTouch = Date.now() - lastTouchTimeRef.current;
        const isAutoLock = timeSinceLastTouch > 10000; // >10s since last touch means auto-lock

        if (!isAutoLock) {
            departureTimeRef.current = Date.now();
            phaseAtDepartureRef.current = phase;
            if (phase === 'WORK' && onAppSwitchRef.current) {
                onAppSwitchRef.current();
            }
        }
    }, [phase]);

    const processReturn = useCallback(() => {
        if (phaseAtDepartureRef.current === 'WORK' && departureTimeRef.current) {
            const timeAway = Date.now() - departureTimeRef.current;
            // 5 second grace period for accidental swipes or quick checks
            if (timeAway > 5000) {
                setWasAbsentDuringFocus(true);
            }
        }
        departureTimeRef.current = null;
        phaseAtDepartureRef.current = null;
    }, []);

    const handleVisibilityChange = useCallback(() => {
        if (document.hidden) {
            processDeparture();
            setIsVisible(false);
        } else {
            processReturn();
            setIsVisible(true);
        }
    }, [processDeparture, processReturn]);

    const handleBlur = useCallback(() => {
        processDeparture();
    }, [processDeparture]);

    const handleFocus = useCallback(() => {
        processReturn();
    }, [processReturn]);

    useEffect(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [handleVisibilityChange, handleBlur, handleFocus]);

    const resetAbsence = useCallback(() => {
        setWasAbsentDuringFocus(false);
    }, []);

    return { isVisible, wasAbsentDuringFocus, resetAbsence };
}
