/**
 * components/battle/BattleTimer.jsx
 * Circular countdown timer for Boss Battle.
 * Turns amber at 30s, red at 10s, pulses when critical.
 */

import { useEffect, useRef, useState } from 'react';

const TOTAL_SECONDS = 90; // Per-question time limit
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const BattleTimer = ({ onTimeUp, isActive, resetKey }) => {
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const intervalRef = useRef(null);

  useEffect(() => {
    setTimeLeft(TOTAL_SECONDS);
  }, [resetKey]);

  useEffect(() => {
    if (!isActive) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isActive, resetKey, onTimeUp]);

  const progress = timeLeft / TOTAL_SECONDS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const color = timeLeft <= 10 ? '#ef4444' : timeLeft <= 30 ? '#f59e0b' : '#6366f1';
  const pulse = timeLeft <= 10 && isActive;

  return (
    <div className={`relative inline-flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Background ring */}
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
        {/* Progress ring */}
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          className="progress-ring-circle"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white tabular-nums">{timeLeft}</span>
        <span className="text-xs text-dark-400">sec</span>
      </div>
    </div>
  );
};

export { TOTAL_SECONDS };
export default BattleTimer;
