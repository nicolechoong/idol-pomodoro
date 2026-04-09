import { useEffect, useRef, useCallback } from 'react';

/**
 * Manages the Screen Wake Lock API to prevent the device from sleeping.
 * Exposes manual request/release so the lock can be acquired inside
 * user-gesture call stacks (required by iOS Safari).
 */
export function useWakeLock() {
    const wakeLockRef = useRef(null);
    const isLockedRef = useRef(false);

    const acquireLock = useCallback(async () => {
        if (!('wakeLock' in navigator)) return;
        try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.warn(`Wake Lock error: ${err.name}, ${err.message}`);
        }
    }, []);

    const requestWakeLock = useCallback(async () => {
        isLockedRef.current = true;
        await acquireLock();
    }, [acquireLock]);

    const releaseWakeLock = useCallback(async () => {
        isLockedRef.current = false;
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
            } catch (e) {
                // Ignore
            }
            wakeLockRef.current = null;
        }
    }, []);

    // Re-acquire lock when the page becomes visible again
    // (iOS releases wake locks when the page is hidden)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isLockedRef.current) {
                acquireLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            releaseWakeLock();
        };
    }, [acquireLock, releaseWakeLock]);

    return { requestWakeLock, releaseWakeLock };
}
