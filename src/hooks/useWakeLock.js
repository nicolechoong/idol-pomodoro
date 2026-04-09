import { useEffect, useRef, useCallback } from 'react';

// Tiny 1-second silent MP4 video encoded as base64.
// Playing this on loop tricks iOS into thinking a video is active,
// which prevents the screen from auto-locking.
const SILENT_MP4 = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA' +
    'OhtZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1NyByMjkzNSA1NDVkZTI' +
    'xIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxOCAtIGh0dHA6Ly93d' +
    '3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0' +
    'xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowL' +
    'jAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MDo' +
    'wIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRoc' +
    'mVhZHM9MSBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0' +
    'xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTM' +
    'ga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGluZmluYWxfbWJyYW5nZT04IHN1Ym1' +
    'lPTcgbWU9dW1oIHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYga' +
    'HJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2t' +
    'pcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz0xIGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY' +
    '2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MDo' +
    'wY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTMga2V5aW50PTI1MCAga2V5aW50X21pbj0yNSBzY' +
    '2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9va2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MDo' +
    'wIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xL' +
    'jQwIGFxPTE6MS4wMACAAAADEWWIhAAh//72la9Hx3bsEPHhp9lf1P8gY0AAADAAOvP9Y/vD6AAAAAD' +
    'EAAacAAAAA0QZYiEABD//64AAAAMAAPzz/QPoAAAAAxAAGnAAAAAAAAAGEGmIhAAQ/yuAAAADABT+8A' +
    'AAAAAAABAYQZ4iEABD//64AAADAAAD88+kD+kAAAAA0QZoiEABD//64AAAAMAAPzz/QPoAAAAAxAAGn';

/**
 * Keeps the screen awake using two strategies:
 * 1. Screen Wake Lock API (works on desktop/Android)
 * 2. Silent video playback trick (reliable fallback for iOS)
 */
export function useWakeLock() {
    const wakeLockRef = useRef(null);
    const videoRef = useRef(null);
    const isLockedRef = useRef(false);

    // Strategy 1: Wake Lock API
    const acquireNativeLock = useCallback(async () => {
        if (!('wakeLock' in navigator)) return;
        try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (err) {
            // Expected to fail on iOS — video fallback handles it
        }
    }, []);

    const releaseNativeLock = useCallback(async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
            } catch (e) { /* ignore */ }
            wakeLockRef.current = null;
        }
    }, []);

    // Strategy 2: Silent video trick (iOS)
    const startVideo = useCallback(() => {
        if (videoRef.current) return; // Already playing

        const video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.setAttribute('loop', '');
        video.setAttribute('src', SILENT_MP4);
        video.style.position = 'fixed';
        video.style.top = '-1px';
        video.style.left = '-1px';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0.01';
        video.muted = true;
        document.body.appendChild(video);

        video.play().catch(() => {
            // If autoplay fails, it will be retried on next user gesture
        });

        videoRef.current = video;
    }, []);

    const stopVideo = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.remove();
            videoRef.current = null;
        }
    }, []);

    // Public API
    const requestWakeLock = useCallback(async () => {
        isLockedRef.current = true;
        acquireNativeLock();
        startVideo();
    }, [acquireNativeLock, startVideo]);

    const releaseWakeLock = useCallback(async () => {
        isLockedRef.current = false;
        releaseNativeLock();
        stopVideo();
    }, [releaseNativeLock, stopVideo]);

    // Re-acquire when page becomes visible again
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isLockedRef.current) {
                acquireNativeLock();
                if (videoRef.current) {
                    videoRef.current.play().catch(() => { });
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            releaseWakeLock();
        };
    }, [acquireNativeLock, releaseWakeLock]);

    return { requestWakeLock, releaseWakeLock };
}
