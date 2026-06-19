import { describe, expect, it } from 'vitest';
import { adminScheduleKeys } from '@/features/admin-schedule/keys';
import { previewedFrom, type ScheduleChangeImpact } from '@/features/admin-schedule/schemas';

describe('adminScheduleKeys', () => {
  it('all is the slice root', () => {
    expect(adminScheduleKeys.all).toEqual(['admin-schedule']);
  });

  it('byEmployee(id) and picker(search) build distinct keys', () => {
    expect(adminScheduleKeys.byEmployee(12)).toEqual(['admin-schedule', 'employee', 12]);
    expect(adminScheduleKeys.picker('ann')).toEqual(['admin-schedule', 'picker', 'ann']);
    expect(adminScheduleKeys.none()).toEqual(['admin-schedule', 'none']);
  });
});

describe('previewedFrom', () => {
  it('flattens both cancel lists into (kind, id, status) snapshots', () => {
    const impact: ScheduleChangeImpact = {
      versioning: 'end_only',
      live_row_id: 1,
      affected_leaves: [
        {
          kind: 'leave',
          id: 7,
          employee_id: 12,
          status: 'approved',
          dates: ['2026-07-06'],
          trigger_dates: ['2026-07-06'],
          temporal: 'future',
          decision: 'cancel',
          leave_type: 'vacation',
          working_days: 1,
        },
      ],
      affected_corrections: [
        {
          kind: 'time_correction',
          id: 9,
          employee_id: 12,
          status: 'pending_l1',
          dates: ['2026-07-06'],
          trigger_dates: ['2026-07-06'],
          temporal: 'future',
          decision: 'cancel',
          leave_type: null,
          working_days: null,
        },
      ],
      freed_leave_days: 1,
    };
    expect(previewedFrom(impact)).toEqual([
      { kind: 'leave', id: 7, status: 'approved' },
      { kind: 'time_correction', id: 9, status: 'pending_l1' },
    ]);
  });
});
