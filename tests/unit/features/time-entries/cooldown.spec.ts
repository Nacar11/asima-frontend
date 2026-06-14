import { describe, it, expect } from 'vitest';
import { cooldownRemainingSeconds, COOLDOWN_MS } from '@/features/time-entries/cooldown';

describe('cooldownRemainingSeconds', () => {
  it('returns remaining seconds within the window', () => {
    const now = new Date('2026-06-14T13:00:00Z');
    expect(cooldownRemainingSeconds('2026-06-14T12:57:00Z', now)).toBe(120); // 3 min ago → 2 min left
  });

  it('returns 0 once the window has passed', () => {
    expect(cooldownRemainingSeconds('2026-06-14T13:00:00Z', new Date('2026-06-14T13:10:00Z'))).toBe(
      0,
    );
  });

  it('returns 0 when there is no last event', () => {
    expect(cooldownRemainingSeconds(null, new Date())).toBe(0);
  });

  it('exposes a 5-minute window', () => {
    expect(COOLDOWN_MS).toBe(5 * 60_000);
  });
});
