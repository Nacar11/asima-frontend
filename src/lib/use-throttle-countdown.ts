'use client';

import { useEffect, useState } from 'react';

/**
 * SPEC §11b: when the backend returns 429, parse Retry-After (the
 * apiClient surfaces it on `ApiError.retryAfterSec`) and tick down a
 * live counter so the UI shows "Try again in M:SS". Reused by every
 * form that hits a throttled endpoint (login, password change).
 *
 * Call `arm(seconds)` from an onError handler. The returned `locked`
 * flag is true while the counter is positive; `formatted` is the
 * pre-rendered M:SS string for direct use in JSX.
 */
export function useThrottleCountdown(): {
  secondsLeft: number;
  locked: boolean;
  formatted: string;
  arm: (seconds: number) => void;
} {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  return {
    secondsLeft,
    locked: secondsLeft > 0,
    formatted: formatCountdown(secondsLeft),
    arm: (seconds: number) => setSecondsLeft(Math.max(0, Math.floor(seconds))),
  };
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
