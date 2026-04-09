import { useEffect, useRef } from 'react';

/**
 * Manages the Screen Wake Lock API to prevent the device from sleeping.
 */
export function useWakeLock(isActive) {
    const wakeLockRef = useRef(null);

    useEffect(() => {
        const releaseWakeLock = async () => {
            if (wakeLockRef.current) {
                try {
                    await wakeLockRef.current.release();
                } catch (e) {
                    // Ignore release errors
                }
                wakeLockRef.current = null;
            }
        };

        const requestWakeLock = async () => {
            if (!isActive) {
                await releaseWakeLock();
                return;
            }

            try {
                if ('wakeLock' in navigator) {
                    // Re-requesting replaces the old lock, but it's cleaner to release first
                    // if there are state discrepancies, though request() handles it natively.
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                }
            } catch (err) {
                console.warn(`Wake Lock error: ${err.name}, ${err.message}`);
            }
        };

        requestWakeLock();

        const handleVisibilityChange = async () => {
            // When document becomes visible again, if we're supposed to be active, re-request
            if (document.visibilityState === 'visible' && isActive) {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            releaseWakeLock();
        };
    }, [isActive]);
}
