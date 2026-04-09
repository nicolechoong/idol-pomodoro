import { useEffect, useRef } from 'react';

/**
 * Manages the Screen Wake Lock API to prevent the device from sleeping.
 */
export function useWakeLock() {
    const wakeLockRef = useRef(null);

    const releaseWakeLock = useCallback(async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
            } catch (e) {
                // Ignore
            }
            wakeLockRef.current = null;
        }
    }, []);

    const requestWakeLock = useCallback(async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            }
        } catch (err) {
            console.warn(`Wake Lock error: ${err.name}, ${err.message}`);
        }
    }, []);

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && wakeLockRef.current !== null) {
                // Automatically re-request if we still theoretically hold the lock intention
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            releaseWakeLock();
        };
    }, [requestWakeLock, releaseWakeLock]);

    return { requestWakeLock, releaseWakeLock };
}
