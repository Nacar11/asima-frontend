import { describe, it, expect } from 'vitest';
import { keyCorrectionsByEntry } from '@/features/time-correction/hooks/use-my-active-corrections';
import type { TimeCorrectionRequest } from '@/features/time-correction/schemas';

describe('keyCorrectionsByEntry', () => {
  it('keys entry-targeted corrections by target_entry_id (no same-day bleed)', () => {
    const rows = [
      { id: 1, target_entry_id: 50, work_date: '2026-06-14' },
      { id: 2, target_entry_id: 51, work_date: '2026-06-14' },
    ] as unknown as TimeCorrectionRequest[];
    const map = keyCorrectionsByEntry(rows);
    expect(map.get(50)?.id).toBe(1);
    expect(map.get(51)?.id).toBe(2);
    expect(map.size).toBe(2);
  });

  it('ignores null-target (new-log) corrections', () => {
    const rows = [
      { id: 9, target_entry_id: null, work_date: '2026-06-14' },
    ] as unknown as TimeCorrectionRequest[];
    expect(keyCorrectionsByEntry(rows).size).toBe(0);
  });
});
