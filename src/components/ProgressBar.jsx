import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({ progress, currentCycle, totalCycles, phase, remainingMs, phaseDuration, workDuration, breakDuration }) {
    const totalDuration = totalCycles * (workDuration + breakDuration) - breakDuration;

    const segments = [];
    const totalSegments = totalCycles * 2 - 1;
    let accumulatedTime = 0;

    for (let i = 1; i <= totalSegments; i++) {
        const isWorkSegment = i % 2 !== 0;
        const segmentDuration = isWorkSegment ? workDuration : breakDuration;
        const segmentPercentage = (segmentDuration / totalDuration) * 100;

        // Let's determine if this segment is completed, current, or future.
        const segmentCycleNum = Math.ceil(i / 2);
        const segmentPhase = isWorkSegment ? 'WORK' : 'BREAK';

        let fillWidth = '0%';
        if (segmentCycleNum < currentCycle || (segmentCycleNum === currentCycle && phase === 'BREAK' && isWorkSegment)) {
            // Past segment
            fillWidth = '100%';
        } else if (segmentCycleNum === currentCycle && phase === segmentPhase) {
            // Current segment
            if (phase === 'DONE') {
                fillWidth = '100%';
            } else if (remainingMs !== undefined && phaseDuration !== undefined) {
                const elapsedInSegment = phaseDuration - remainingMs;
                fillWidth = `${Math.max(0, Math.min(100, (elapsedInSegment / segmentDuration) * 100))}%`;
            }
        } else if (phase === 'DONE') {
            fillWidth = '100%';
        }

        segments.push(
            <div
                key={i}
                className={`story-bar-track ${!isWorkSegment ? 'break-track' : ''}`}
                style={{ width: `${segmentPercentage}%` }}
            >
                <div
                    className={`story-bar-fill ${!isWorkSegment ? 'break-fill' : ''}`}
                    style={{ width: fillWidth }}
                />
            </div>
        );

        accumulatedTime += segmentDuration;
    }

    return (
        <div className="progress-bar-container" id="progress-bar">
            {segments}
        </div>
    );
}
