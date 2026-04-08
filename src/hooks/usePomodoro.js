import { useState, useRef, useCallback, useEffect } from 'react';

export function usePomodoro() {
    const [phase, setPhase] = useState('IDLE');
    const [currentCycle, setCurrentCycle] = useState(0);
    const [totalCycles, setTotalCycles] = useState(0);
    const [remainingMs, setRemainingMs] = useState(0);
    const [phaseDuration, setPhaseDuration] = useState(0);
    const [workDuration, setWorkDuration] = useState(25 * 60 * 1000);
    const [breakDuration, setBreakDuration] = useState(5 * 60 * 1000);

    const phaseStartTimeRef = useRef(null);
    const phaseDurationRef = useRef(0);
    const rafRef = useRef(null);
    const phaseRef = useRef('IDLE');
    const currentCycleRef = useRef(0);
    const totalCyclesRef = useRef(0);
    const pausedRemainingRef = useRef(null);
    const workDurationRef = useRef(25 * 60 * 1000);
    const breakDurationRef = useRef(5 * 60 * 1000);

    const stopLoop = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    const tick = useCallback(() => {
        if (!phaseStartTimeRef.current) return;

        const elapsed = Date.now() - phaseStartTimeRef.current;
        const remaining = Math.max(0, phaseDurationRef.current - elapsed);
        setRemainingMs(remaining);

        if (remaining <= 0) {
            const curPhase = phaseRef.current;
            const curCycle = currentCycleRef.current;
            const totCycles = totalCyclesRef.current;

            if (curPhase === 'WORK') {
                if (curCycle >= totCycles) {
                    phaseRef.current = 'DONE';
                    setPhase('DONE');
                    stopLoop();
                    return;
                }
                phaseRef.current = 'BREAK';
                setPhase('BREAK');
                phaseDurationRef.current = breakDurationRef.current;
                setPhaseDuration(breakDurationRef.current);
                phaseStartTimeRef.current = Date.now();
                setRemainingMs(breakDurationRef.current);
            } else if (curPhase === 'BREAK') {
                const nextCycle = curCycle + 1;
                currentCycleRef.current = nextCycle;
                setCurrentCycle(nextCycle);
                phaseRef.current = 'WORK';
                setPhase('WORK');
                phaseDurationRef.current = workDurationRef.current;
                setPhaseDuration(workDurationRef.current);
                phaseStartTimeRef.current = Date.now();
                setRemainingMs(workDurationRef.current);
            }
        }

        rafRef.current = requestAnimationFrame(tick);
    }, [stopLoop]);

    const startLoop = useCallback(() => {
        stopLoop();
        rafRef.current = requestAnimationFrame(tick);
    }, [tick, stopLoop]);

    const start = useCallback((cycles, wMin = 25, bMin = 5) => {
        const c = Math.max(1, Math.min(8, cycles));
        const wD = wMin * 60 * 1000;
        const bD = bMin * 60 * 1000;

        totalCyclesRef.current = c;
        currentCycleRef.current = 1;
        setTotalCycles(c);
        setCurrentCycle(1);

        workDurationRef.current = wD;
        breakDurationRef.current = bD;
        setWorkDuration(wD);
        setBreakDuration(bD);

        phaseRef.current = 'WORK';
        setPhase('WORK');
        phaseDurationRef.current = wD;
        setPhaseDuration(wD);
        phaseStartTimeRef.current = Date.now();
        setRemainingMs(wD);
        pausedRemainingRef.current = null;

        startLoop();
    }, [startLoop]);

    const pause = useCallback(() => {
        if (phaseRef.current === 'IDLE' || phaseRef.current === 'DONE') return;
        const elapsed = Date.now() - phaseStartTimeRef.current;
        pausedRemainingRef.current = Math.max(0, phaseDurationRef.current - elapsed);
        stopLoop();
    }, [stopLoop]);

    const resume = useCallback(() => {
        if (pausedRemainingRef.current == null) return;
        const previouslyElapsed = phaseDurationRef.current - pausedRemainingRef.current;
        phaseStartTimeRef.current = Date.now() - previouslyElapsed;
        pausedRemainingRef.current = null;
        startLoop();
    }, [startLoop]);

    const reset = useCallback(() => {
        stopLoop();
        phaseRef.current = 'IDLE';
        setPhase('IDLE');
        setCurrentCycle(0);
        setTotalCycles(0);
        setRemainingMs(0);
        setPhaseDuration(0);
        phaseStartTimeRef.current = null;
        pausedRemainingRef.current = null;
    }, [stopLoop]);

    useEffect(() => {
        return () => stopLoop();
    }, [stopLoop]);

    const overallProgress = (() => {
        if (phase === 'IDLE') return 0;
        if (phase === 'DONE') return 1;
        const totalDuration = totalCycles * (workDuration + breakDuration) - breakDuration;
        const completedCycles = currentCycle - 1;
        let elapsed = completedCycles * (workDuration + breakDuration);
        if (phase === 'WORK') {
            elapsed += (phaseDuration - remainingMs);
        } else if (phase === 'BREAK') {
            elapsed += workDuration + (phaseDuration - remainingMs);
        }
        return Math.min(1, elapsed / totalDuration);
    })();

    return {
        phase,
        currentCycle,
        totalCycles,
        remainingMs,
        phaseDuration,
        overallProgress,
        workDuration,
        breakDuration,
        isPaused: pausedRemainingRef.current != null,
        start,
        pause,
        resume,
        reset,
    };
}
