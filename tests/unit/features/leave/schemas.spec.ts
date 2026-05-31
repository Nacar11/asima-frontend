import { describe, expect, it } from 'vitest';
import {
  LeaveRequestSchema,
  LeaveRequestListSchema,
  SubmitLeaveSchema,
  LEAVE_TYPES,
  LEAVE_STATUSES,
} from '@/features/leave/schemas';

const ROW = {
  id: 1,
  employee_id: 12,
  leave_type: 'annual',
  start_date: '2026-06-01',
  end_date: '2026-06-05',
  reason: 'Family trip',
  status: 'pending_l1',
  submitted_at: '2026-05-30T10:00:00.000Z',
  decided_at: null,
  decided_by: null,
  decision_note: null,
  decision_path: null,
  cancelled_at: null,
  cancelled_by: null,
  l1_approver_id: 5,
  l2_approver_id: 7,
  created_at: '2026-05-30T10:00:00.000Z',
  updated_at: '2026-05-30T10:00:00.000Z',
};

describe('leave schemas', () => {
  it('parses a leave request row', () => {
    const row = LeaveRequestSchema.parse(ROW);
    expect(row.leave_type).toBe('annual');
    expect(row.l2_approver_id).toBe(7);
  });

  it('accepts a single-step chain (null l2) and terminal decision fields', () => {
    const row = LeaveRequestSchema.parse({
      ...ROW,
      status: 'approved',
      decided_at: '2026-05-31T10:00:00.000Z',
      decided_by: 5,
      decision_path: 'chain',
      l2_approver_id: null,
    });
    expect(row.l2_approver_id).toBeNull();
    expect(row.decision_path).toBe('chain');
  });

  it('rejects an unknown leave_type', () => {
    expect(() => LeaveRequestSchema.parse({ ...ROW, leave_type: 'sabbatical' })).toThrow();
  });

  it('parses the paginated envelope', () => {
    const list = LeaveRequestListSchema.parse({
      data: [ROW],
      total: 1,
      page: 1,
      limit: 20,
      has_more: false,
    });
    expect(list.data).toHaveLength(1);
  });

  it('exposes the five leave types and five statuses', () => {
    expect(LEAVE_TYPES).toEqual(['annual', 'sick', 'bereavement', 'unpaid', 'other']);
    expect(LEAVE_STATUSES).toContain('pending_l2');
  });

  it('SubmitLeaveSchema requires end_date >= start_date', () => {
    const ok = SubmitLeaveSchema.safeParse({
      leave_type: 'sick',
      start_date: '2026-06-01',
      end_date: '2026-06-01',
      reason: '',
    });
    expect(ok.success).toBe(true);

    const bad = SubmitLeaveSchema.safeParse({
      leave_type: 'sick',
      start_date: '2026-06-05',
      end_date: '2026-06-01',
    });
    expect(bad.success).toBe(false);
  });
});
