import { useState, useEffect } from 'react';

interface FastingTimerResult {
  /** Seconds elapsed since fasting started. */
  elapsed: number;
  /** Seconds remaining until the target is reached (0 when complete). */
  remaining: number;
  /** Progress ratio [0, 1] — capped at 1 when complete. */
  progress: number;
  /** Remaining time formatted as HH:MM:SS. */
  remainingFormatted: string;
  /** Elapsed time formatted as HH:MM:SS. */
  elapsedFormatted: string;
  /** True when elapsed >= targetSeconds. */
  isComplete: boolean;
}

function pad(n: number): string {
  return String(Math.floor(n)).padStart(2, '0');
}

function secondsToHHMMSS(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const hours   = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Tracks the progress of a fasting window in real time.
 *
 * @param targetHours - Duration of the fasting protocol in hours (e.g. 16 for 16:8).
 * @param startTime   - The Date when fasting began.
 *
 * Updates every 1 000 ms via setInterval. The interval is cleared on unmount.
 */
export function useFastingTimer(
  targetHours: number,
  startTime: Date,
): FastingTimerResult {
  const targetSeconds = targetHours * 3600;

  function compute(): FastingTimerResult {
    const elapsed    = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const remaining  = Math.max(0, targetSeconds - elapsed);
    const progress   = Math.min(elapsed / targetSeconds, 1);
    const isComplete = elapsed >= targetSeconds;

    return {
      elapsed,
      remaining,
      progress,
      remainingFormatted: secondsToHHMMSS(remaining),
      elapsedFormatted:   secondsToHHMMSS(elapsed),
      isComplete,
    };
  }

  const [state, setState] = useState<FastingTimerResult>(compute);

  useEffect(() => {
    // Recalculate immediately in case startTime or targetHours changed.
    setState(compute());

    const interval = setInterval(() => {
      setState(compute());
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetHours, startTime.getTime()]);

  return state;
}
