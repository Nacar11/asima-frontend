import { describe, expect, it } from 'vitest';
import { PendingApprovalListSchema, PendingApprovalSchema } from '@/features/approvals/schemas';

describe('PendingApprovalSchema', () => {
  const wellFormed = {
    id: 1,
    kind: 'leave',
    employee_id: 7,
    employee_name: 'Jane Smith',
    requested_at: '2026-05-25T08:00:00.000Z',
    current_step: 1,
    current_approver_id: 12,
    current_approver_name: 'Danielle Aguilar',
    summary: 'Vacation 2026-06-01 to 2026-06-05',
  };

  it('parses a well-formed row', () => {
    expect(() => PendingApprovalSchema.parse(wellFormed)).not.toThrow();
  });

  it('requires current_approver_name (backend always provides a string)', () => {
    const { current_approver_name: _omit, ...withoutName } = wellFormed;
    expect(() => PendingApprovalSchema.parse(withoutName)).toThrow();
  });

  it('rejects an unknown kind value', () => {
    const bad = {
      id: 1,
      kind: 'expense',
      employee_id: 7,
      employee_name: 'Jane',
      requested_at: '2026-05-25T00:00:00.000Z',
      current_step: 0,
      current_approver_id: 12,
      summary: 's',
    };
    expect(() => PendingApprovalSchema.parse(bad)).toThrow();
  });
});

describe('PendingApprovalListSchema', () => {
  it('parses the empty paginated payload returned by the v0 backend', () => {
    expect(() =>
      PendingApprovalListSchema.parse({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        has_more: false,
      }),
    ).not.toThrow();
  });
});
