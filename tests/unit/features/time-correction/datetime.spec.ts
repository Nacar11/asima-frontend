import { describe, expect, it } from 'vitest';
import {
  isoToTimeInput,
  localDateTimeToIso,
  replaceTimeOnIso,
} from '@/features/time-correction/datetime';

describe('time-correction datetime helpers', () => {
  it('isoToTimeInput renders the browser-local HH:mm of an instant', () => {
    // Build a local instant so the assertion is timezone-independent.
    const iso = new Date(2026, 5, 10, 9, 5, 0).toISOString();
    expect(isoToTimeInput(iso)).toBe('09:05');
  });

  it('isoToTimeInput returns empty string for an invalid input', () => {
    expect(isoToTimeInput('nonsense')).toBe('');
  });

  it('localDateTimeToIso interprets date + time in the local zone (Add Logs path)', () => {
    expect(localDateTimeToIso('2026-06-10', '09:00')).toBe(
      new Date('2026-06-10T09:00').toISOString(),
    );
  });

  it('replaceTimeOnIso keeps the original instant when the time is unchanged (round-trip)', () => {
    const iso = new Date(2026, 5, 10, 9, 0, 0).toISOString();
    expect(replaceTimeOnIso(iso, isoToTimeInput(iso))).toBe(iso);
  });

  it('replaceTimeOnIso swaps only the time, preserving the original local date', () => {
    const iso = new Date(2026, 5, 10, 9, 0, 0).toISOString();
    expect(replaceTimeOnIso(iso, '18:30')).toBe(new Date(2026, 5, 10, 18, 30, 0).toISOString());
  });
});
