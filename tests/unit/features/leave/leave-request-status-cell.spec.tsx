import { describe, expect, it, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { LeaveRequestStatusCell } from '@/features/leave/components/leave-request-status-cell';
import type { LeaveRequest } from '@/features/leave/schemas';

/** A fully-populated base row; each test overrides only what it asserts on. */
function row(overrides: Partial<LeaveRequest> = {}): LeaveRequest {
  return {
    id: 1,
    employee_id: 12,
    employee_name: 'Ada Lovelace',
    leave_type: 'vacation',
    start_date: '2026-06-01',
    end_date: '2026-06-05',
    working_days: 3,
    day_portion: 'full',
    start_time: null,
    end_time: null,
    reason: null,
    status: 'pending_l1',
    submitted_at: '2026-05-30T10:00:00.000Z',
    decided_at: null,
    decided_by: null,
    decision_note: null,
    decision_path: null,
    cancelled_at: null,
    cancelled_by: null,
    l1_approver_id: 5,
    l2_approver_id: null,
    l1_approver_name: 'Grace Hopper',
    l2_approver_name: null,
    decided_by_name: null,
    created_at: '2026-05-30T10:00:00.000Z',
    updated_at: '2026-05-30T10:00:00.000Z',
    ...overrides,
  } as LeaveRequest;
}

function renderCell(r: LeaveRequest) {
  const { container } = render(<LeaveRequestStatusCell request={r} />);
  return container.textContent ?? '';
}

describe('LeaveRequestStatusCell', () => {
  afterEach(() => vi.useRealTimers());

  it('pending_l1 with an L2: shows the badge, the awaited L1, and the upcoming L2', () => {
    const text = renderCell(
      row({
        status: 'pending_l1',
        l1_approver_name: 'Grace Hopper',
        l2_approver_id: 9,
        l2_approver_name: 'Alan Turing',
      }),
    );
    expect(text).toContain('Pending L1');
    expect(text).toContain('Grace Hopper');
    expect(text).toContain('Alan Turing');
  });

  it('pending_l1 without an L2: shows no L2 approver line', () => {
    const text = renderCell(
      row({ status: 'pending_l1', l2_approver_id: null, l2_approver_name: null }),
    );
    expect(text).toContain('Pending L1');
    expect(text).toContain('Grace Hopper');
    expect(text).not.toContain('L2');
  });

  it('pending_l2: shows the cleared L1 and the awaited L2', () => {
    const text = renderCell(
      row({
        status: 'pending_l2',
        l1_approver_name: 'Grace Hopper',
        l2_approver_id: 9,
        l2_approver_name: 'Alan Turing',
      }),
    );
    expect(text).toContain('Pending L2');
    expect(text).toContain('Grace Hopper');
    expect(text).toContain('Alan Turing');
  });

  it('approved: shows the decider and a relative decision time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-08T12:00:00Z'));
    const text = renderCell(
      row({
        status: 'approved',
        decided_at: '2026-06-08T11:58:00Z',
        decided_by: 7,
        decided_by_name: 'Edsger Dijkstra',
      }),
    );
    expect(text).toContain('Approved');
    expect(text).toContain('Edsger Dijkstra');
    expect(text).toContain('2 minutes ago');
  });

  it('rejected: shows the decider and a relative decision time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-08T12:00:00Z'));
    const text = renderCell(
      row({
        status: 'rejected',
        decided_at: '2026-06-08T11:58:00Z',
        decided_by: 7,
        decided_by_name: 'Edsger Dijkstra',
      }),
    );
    expect(text).toContain('Rejected');
    expect(text).toContain('Edsger Dijkstra');
    expect(text).toContain('2 minutes ago');
  });

  it('cancelled: shows a relative time from cancelled_at and no approver line', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-08T12:00:00Z'));
    const text = renderCell(
      row({
        status: 'cancelled',
        cancelled_at: '2026-06-08T11:58:00Z',
        cancelled_by: 12,
      }),
    );
    expect(text).toContain('Cancelled');
    expect(text).toContain('2 minutes ago');
    expect(text).not.toContain('Grace Hopper');
  });

  it('falls back to an em dash when an approver name is missing', () => {
    const text = renderCell(row({ status: 'pending_l1', l1_approver_name: null }));
    expect(text).toContain('Pending L1');
    expect(text).toContain('—');
  });
});
