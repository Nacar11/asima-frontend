import { describe, expect, it } from 'vitest';
import {
  TimeCorrectionSchema,
  TimeCorrectionListSchema,
  SubmitCorrectionSchema,
  TC_STATUSES,
} from '@/features/time-correction/schemas';

const ROW = {
  id: 1,
  employee_id: 12,
  target_entry_id: 88,
  work_date: '2026-06-10',
  proposed_time_in: '2026-06-10T09:00:00.000Z',
  proposed_time_out: '2026-06-10T18:00:00.000Z',
  reason: 'Forgot to clock in',
  status: 'pending_l1',
  submitted_at: '2026-06-10T19:00:00.000Z',
  decided_at: null,
  decided_by: null,
  decision_note: null,
  decision_path: null,
  cancelled_at: null,
  cancelled_by: null,
  l1_approver_id: 5,
  l2_approver_id: null,
  created_at: '2026-06-10T19:00:00.000Z',
  updated_at: '2026-06-10T19:00:00.000Z',
};

describe('time-correction schemas', () => {
  it('parses a correction request row', () => {
    const row = TimeCorrectionSchema.parse(ROW);
    expect(row.target_entry_id).toBe(88);
    expect(row.proposed_time_out).toBe('2026-06-10T18:00:00.000Z');
  });

  it('accepts a missed-punch (null target_entry_id) with an open segment', () => {
    const row = TimeCorrectionSchema.parse({
      ...ROW,
      target_entry_id: null,
      proposed_time_out: null,
    });
    expect(row.target_entry_id).toBeNull();
    expect(row.proposed_time_out).toBeNull();
  });

  it('parses the paginated envelope', () => {
    const list = TimeCorrectionListSchema.parse({
      data: [ROW],
      total: 1,
      page: 1,
      limit: 20,
      has_more: false,
    });
    expect(list.total).toBe(1);
  });

  it('exposes the five statuses', () => {
    expect(TC_STATUSES).toContain('pending_l2');
  });

  it('SubmitCorrectionSchema requires out > in when out present', () => {
    const ok = SubmitCorrectionSchema.safeParse({
      work_date: '2026-06-10',
      proposed_time_in: '2026-06-10T09:00',
      proposed_time_out: '2026-06-10T18:00',
      reason: 'late punch',
    });
    expect(ok.success).toBe(true);

    const bad = SubmitCorrectionSchema.safeParse({
      work_date: '2026-06-10',
      proposed_time_in: '2026-06-10T18:00',
      proposed_time_out: '2026-06-10T09:00',
      reason: 'oops',
    });
    expect(bad.success).toBe(false);
  });

  it('SubmitCorrectionSchema allows an open segment (no out) and requires a reason', () => {
    expect(
      SubmitCorrectionSchema.safeParse({
        work_date: '2026-06-10',
        proposed_time_in: '2026-06-10T09:00',
        reason: 'forgot to clock out',
      }).success,
    ).toBe(true);
    expect(
      SubmitCorrectionSchema.safeParse({
        work_date: '2026-06-10',
        proposed_time_in: '2026-06-10T09:00',
        reason: '',
      }).success,
    ).toBe(false);
  });
});
