import { useEffect, useRef, useCallback } from 'react';

const NOTIFICATION_LEAD_TIME = 30 * 1000; // 30 seconds before break ends

function canNotify() {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

function sendNotification(title, body) {
    if (!canNotify()) return;
    try {
        new Notification(title, {
            body,
            icon: '/idol-pomodoro/icons/icon-192.png',
        });
    } catch (e) {
        // Silently fail on environments that block notifications
    }
}

/**
 * Manages notification permission and proactively schedules
 * notifications via setTimeout so they fire even when backgrounded.
 */
export function useNotification(phase, remainingMs, phaseDuration) {
    const permissionRef = useRef(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    // Scheduled timeout IDs
    const focusEndRef = useRef(null);
    const breakWarningRef = useRef(null);
    const sessionDoneRef = useRef(null);
    const prevPhaseRef = useRef(phase);

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) return;
        if (permissionRef.current === 'default') {
            const result = await Notification.requestPermission();
            permissionRef.current = result;
        }
    }, []);

    const clearAllTimeouts = useCallback(() => {
        if (focusEndRef.current) { clearTimeout(focusEndRef.current); focusEndRef.current = null; }
        if (breakWarningRef.current) { clearTimeout(breakWarningRef.current); breakWarningRef.current = null; }
        if (sessionDoneRef.current) { clearTimeout(sessionDoneRef.current); sessionDoneRef.current = null; }
    }, []);

    // Schedule notifications proactively when a phase starts
    useEffect(() => {
        const prev = prevPhaseRef.current;
        prevPhaseRef.current = phase;

        // Only schedule on actual phase transitions
        if (prev === phase) return;

        clearAllTimeouts();

        if (!canNotify()) return;

        if (phase === 'WORK') {
            // Schedule "focus complete" notification for when this work phase ends
            focusEndRef.current = setTimeout(() => {
                sendNotification('Idol Pomodoro 🎤', '집중 시간 끝! 이제 쉬는 시간이다윰~ 🍵');
            }, remainingMs);
        } else if (phase === 'BREAK') {
            // Schedule "break almost over" warning 30s before break ends
            const warningDelay = remainingMs - NOTIFICATION_LEAD_TIME;
            if (warningDelay > 0) {
                breakWarningRef.current = setTimeout(() => {
                    sendNotification('Idol Pomodoro 🎤', '쉬는 시간 거의 끝났다윰! 곧 다시 시작하자~ 🎤');
                }, warningDelay);
            }
        } else if (phase === 'DONE') {
            // Session complete — fire immediately
            sendNotification('Idol Pomodoro 🎤', '세션 완료! 누나 진짜 잘했어 츄츄 ⭐');
        }

        return clearAllTimeouts;
    }, [phase, clearAllTimeouts]); // remainingMs intentionally excluded — only schedule on phase change

    return { requestPermission };
}
