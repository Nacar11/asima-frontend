import { describe, expect, it } from 'vitest';
import { canCancel } from '@/features/leave/format';
import type { LeaveRequest } from '@/features/leave/schemas';

/** Only status + end_date drive canCancel; the rest is filler. */
function row(status: LeaveRequest['status'], end_date: string): LeaveRequest {
  return { status, end_date } as LeaveRequest;
}

const TODAY = '2026-06-08';

describe('canCancel', () => {
  it('allows a pending request whose leave is still in the future', () => {
    expect(canCancel(row('pending_l1', '2026-06-20'), TODAY)).toBe(true);
    expect(canCancel(row('pending_l2', '2026-06-20'), TODAY)).toBe(true);
  });

  it('allows an approved request whose leave is still in the future', () => {
    expect(canCancel(row('approved', '2026-06-20'), TODAY)).toBe(true);
  });

  it('allows cancellation while the leave is in progress (ends today or later)', () => {
    expect(canCancel(row('approved', TODAY), TODAY)).toBe(true);
  });

  it('blocks an approved request that has already fully elapsed', () => {
    expect(canCancel(row('approved', '2026-06-01'), TODAY)).toBe(false);
  });

  it('blocks a pending request that has already fully elapsed', () => {
    expect(canCancel(row('pending_l1', '2026-06-01'), TODAY)).toBe(false);
  });

  it('blocks terminal states regardless of date', () => {
    expect(canCancel(row('rejected', '2026-06-20'), TODAY)).toBe(false);
    expect(canCancel(row('cancelled', '2026-06-20'), TODAY)).toBe(false);
  });
});
