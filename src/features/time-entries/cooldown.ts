/** Mirrors the backend `PUNCH_COOLDOWN_MINUTES = 5`. The 429 from the server
 *  is authoritative; this is only for the optimistic on-screen countdown. */
export const COOLDOWN_MS = 5 * 60_000;

/**
 * Seconds left in the punch cooldown given the last punch event's ISO time, or
 * 0 when the window has elapsed or there is no prior event.
 */
export function cooldownRemainingSeconds(lastEventIso: string | null, now: Date): number {
  if (!lastEventIso) return 0;
  const elapsed = now.getTime() - new Date(lastEventIso).getTime();
  return elapsed >= COOLDOWN_MS ? 0 : Math.ceil((COOLDOWN_MS - elapsed) / 1000);
}
