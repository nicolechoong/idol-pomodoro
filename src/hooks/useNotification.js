import { useEffect, useRef, useCallback } from 'react';

const NOTIFICATION_LEAD_TIME = 30 * 1000; // 30 seconds before break ends

/**
 * Manages notification permission and schedules reminders.
 */
export function useNotification(phase, remainingMs) {
    const permissionRef = useRef(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const timeoutRef = useRef(null);
    const prevPhaseRef = useRef(phase);

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) return;
        if (permissionRef.current === 'default') {
            const result = await Notification.requestPermission();
            permissionRef.current = result;
        }
    }, []);

    // Notify when focus time completes
    useEffect(() => {
        const prev = prevPhaseRef.current;
        prevPhaseRef.current = phase;

        if (prev !== phase && prev === 'WORK' && permissionRef.current === 'granted' && typeof Notification !== 'undefined') {
            if (phase === 'BREAK') {
                new Notification('Idol Pomodoro 🎤', {
                    body: '집중 시간 끝! 이제 쉬는 시간이다윰~ 🍵',
                    icon: '/idol-pomodoro/icons/icon-192.png',
                    tag: 'focus-complete',
                });
            } else if (phase === 'DONE') {
                new Notification('Idol Pomodoro 🎤', {
                    body: '세션 완료! 누나 진짜 잘했어 츄츄 ⭐',
                    icon: '/idol-pomodoro/icons/icon-192.png',
                    tag: 'session-complete',
                });
            }
        }
    }, [phase]);

    // Schedule notification 30s before break ends
    useEffect(() => {
        // Clear previous
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (phase !== 'BREAK' || permissionRef.current !== 'granted') return;

        const delay = remainingMs - NOTIFICATION_LEAD_TIME;
        if (delay <= 0) return;

        timeoutRef.current = setTimeout(() => {
            if (document.hidden && typeof Notification !== 'undefined') {
                new Notification('Idol Pomodoro 🎤', {
                    body: '쉬는 시간 거의 끝났다윰! 곧 다시 시작하자~ 🎤',
                    icon: '/idol-pomodoro/icons/icon-192.png',
                    tag: 'break-ending',
                });
            }
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [phase]);

    return { requestPermission };
}

