import { describe, it, expect } from 'vitest';
import { deficitHours, timesheetStatus, approverStates } from '@/features/time-entries/metrics';
import type { TimeEntry } from '@/features/time-entries/schemas';
import type { WorkSchedule } from '@/features/schedule/schemas';
import type { TimeCorrectionRequest } from '@/features/time-correction/schemas';

const schedule = {
  expected_in: '09:00:00',
  expected_out: '18:30:00',
  break_minutes: 60,
} as WorkSchedule;

// Build wall-clock times as local-naive (NO trailing Z) then ISO — mirrors
// entries-table.spec.tsx. In test, resolveDisplayTz() is runtime-local, so a
// local-naive time formats back to the same wall-clock on any machine (UTC CI
// included). Hardcoding a Z/UTC offset would only pass on an Asia/Manila box.
const iso = (t: string) => new Date(`2026-06-10T${t}`).toISOString();

function entry(over: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: 1,
    employee_id: 1,
    work_date: '2026-06-10',
    time_in: iso('09:00:00'),
    time_out: iso('18:30:00'),
    source: 'manual',
    status: 'confirmed',
    notes: null,
    created_by: null,
    updated_by: null,
    deleted_by: null,
    created_at: '',
    updated_at: '',
    deleted_at: null,
    ...over,
  };
}

function correction(over: Partial<TimeCorrectionRequest> = {}): TimeCorrectionRequest {
  return {
    id: 9,
    employee_id: 1,
    target_entry_id: 1,
    work_date: '2026-06-10',
    proposed_time_in: iso('09:00:00'),
    proposed_time_out: iso('18:30:00'),
    reason: 'x',
    status: 'pending_l1',
    submitted_at: '',
    decided_at: null,
    decided_by: null,
    decision_note: null,
    decision_path: null,
    cancelled_at: null,
    cancelled_by: null,
    l1_approver_id: 5,
    l2_approver_id: 7,
    l1_approver_name: 'Jane Cruz',
    l2_approver_name: 'Bob Lim',
    created_at: '',
    updated_at: '',
    ...over,
  };
}

describe('deficitHours', () => {
  it('counts a one-hour-late arrival with on-time out as 1.00', () => {
    const e = entry({ time_in: iso('10:00:00') });
    expect(deficitHours(e, schedule)).toBeCloseTo(1, 5);
  });
  it('is 0 for an exactly-on-schedule day', () => {
    expect(deficitHours(entry(), schedule)).toBe(0);
  });
  it('is null for an open entry', () => {
    expect(deficitHours(entry({ time_out: null }), schedule)).toBeNull();
  });
  it('is null when there is no schedule', () => {
    expect(deficitHours(entry(), undefined)).toBeNull();
  });
});

describe('timesheetStatus', () => {
  it('is ongoing when still clocked in', () => {
    expect(timesheetStatus(entry({ time_out: null }), undefined)).toBe('ongoing');
  });
  it('is applied for a pending correction', () => {
    expect(timesheetStatus(entry(), correction({ status: 'pending_l2' }))).toBe('applied');
  });
  it('is approved for an approved correction', () => {
    expect(timesheetStatus(entry(), correction({ status: 'approved' }))).toBe('approved');
  });
  it('is logged for a normal confirmed punch', () => {
    expect(timesheetStatus(entry(), undefined)).toBe('logged');
  });
});

describe('approverStates', () => {
  it('pending_l1 → both pending (two-level chain)', () => {
    expect(approverStates(correction({ status: 'pending_l1' }))).toEqual({
      l1: 'pending',
      l2: 'pending',
    });
  });
  it('pending_l2 → L1 approved, L2 pending', () => {
    expect(approverStates(correction({ status: 'pending_l2' }))).toEqual({
      l1: 'approved',
      l2: 'pending',
    });
  });
  it('approved → both approved', () => {
    expect(approverStates(correction({ status: 'approved' }))).toEqual({
      l1: 'approved',
      l2: 'approved',
    });
  });
  it('single-level chain marks L2 n/a', () => {
    expect(approverStates(correction({ status: 'approved', l2_approver_id: null })).l2).toBe('na');
  });
});
