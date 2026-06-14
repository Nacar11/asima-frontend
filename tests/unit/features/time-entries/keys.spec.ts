import { describe, expect, it } from 'vitest';
import { timeEntryKeys } from '@/features/time-entries/keys';

// Locks the value-preservation invariant for the query-key refactor:
// each factory method must return the exact array its inline key replaced.
describe('timeEntryKeys', () => {
  it('all is the slice root', () => {
    expect(timeEntryKeys.all).toEqual(['time-entries']);
  });

  it('today()', () => {
    expect(timeEntryKeys.today()).toEqual(['time-entries', 'today']);
  });

  it('meList(page)', () => {
    expect(timeEntryKeys.meList(2)).toEqual(['time-entries', 'me', 2]);
  });
});
