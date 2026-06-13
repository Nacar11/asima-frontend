import { formatTimeInTz } from '@/lib/format';
import type { WorkSchedule } from '@/features/schedule/schemas';
import type { TimeCorrectionRequest } from '@/features/time-correction/schemas';
import type { TimeEntry } from './schemas';

/* "09:00" or "09:00:00" → minutes since midnight. */
function timeStrToMinutes(t: string): number {
  const [h = 0, m = 0] = t.split(':').map(Number);
  return h * 60 + m;
}

/* ISO timestamp → wall-clock minute-of-day in the display tz. */
function isoToWallMinutes(iso: string): number {
  return timeStrToMinutes(formatTimeInTz(iso));
}

/**
 * "2026-05-23" → 6 (Saturday). Constructed as local-naive so the day
 * doesn't shift across timezones (new Date("2026-05-23") would parse as
 * UTC midnight and roll backward in negative offsets).
 */
export function dowFromWorkDate(workDate: string): number {
  const [y, m, d] = workDate.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1).getDay();
}

/**
 * Pick the schedule row in effect for `workDate` on its day of week.
 * Returns undefined when the employee has no rule covering that day.
 */
export function findScheduleForDate(
  schedules: WorkSchedule[],
  workDate: string,
): WorkSchedule | undefined {
  const dow = dowFromWorkDate(workDate);
  const candidates = schedules
    .filter(
      (s) =>
        s.day_of_week === dow &&
        s.effective_from <= workDate &&
        (s.effective_to === null || workDate <= s.effective_to),
    )
    .sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1));
  return candidates[0];
}

/** Minutes late vs scheduled in. Floors at 0 (early in counts as on time). */
export function tardinessMinutes(
  entry: TimeEntry,
  schedule: WorkSchedule | undefined,
): number | null {
  if (!schedule) return null;
  return Math.max(0, isoToWallMinutes(entry.time_in) - timeStrToMinutes(schedule.expected_in));
}

/** Minutes left early vs scheduled out. Null for open entries. */
export function undertimeMinutes(
  entry: TimeEntry,
  schedule: WorkSchedule | undefined,
): number | null {
  if (!entry.time_out || !schedule) return null;
  return Math.max(0, timeStrToMinutes(schedule.expected_out) - isoToWallMinutes(entry.time_out));
}

/** Paid hours from the schedule: (out − in − break) / 60. */
export function scheduledRegularHours(schedule: WorkSchedule | undefined): number | null {
  if (!schedule) return null;
  const span = timeStrToMinutes(schedule.expected_out) - timeStrToMinutes(schedule.expected_in);
  return Math.max(0, (span - schedule.break_minutes) / 60);
}

export type TimesheetStatus = 'ongoing' | 'applied' | 'approved' | 'logged';

/**
 * Derived row status for the timesheet. "Ongoing" = still clocked in;
 * "Applied"/"Approved" reflect a matching correction's lifecycle; otherwise a
 * normal confirmed punch is "Logged". Corrections that were rejected/cancelled
 * aren't fetched for this view, so those rows correctly fall back to "Logged".
 */
export function timesheetStatus(
  entry: TimeEntry,
  correction: TimeCorrectionRequest | undefined,
): TimesheetStatus {
  if (!entry.time_out) return 'ongoing';
  if (correction) {
    if (correction.status === 'pending_l1' || correction.status === 'pending_l2') return 'applied';
    if (correction.status === 'approved') return 'approved';
  }
  return 'logged';
}

/**
 * Total scheduled-time deficit in decimal hours: tardiness (late in) plus
 * undertime (early out), each already floored at 0. Null for open entries or
 * days with no schedule row (same "don't fabricate a baseline" rule as the
 * minute metrics).
 */
export function deficitHours(entry: TimeEntry, schedule: WorkSchedule | undefined): number | null {
  const late = tardinessMinutes(entry, schedule);
  const under = undertimeMinutes(entry, schedule);
  if (late === null || under === null) return null;
  return (late + under) / 60;
}

export type ApproverLevelState = 'pending' | 'approved' | 'rejected' | 'na';

/**
 * Per-level approval state derived from the single correction status enum.
 * `na` = no such level (single-level chain) or a terminal state where the
 * level never acted.
 */
export function approverStates(correction: TimeCorrectionRequest): {
  l1: ApproverLevelState;
  l2: ApproverLevelState;
} {
  const hasL2 = correction.l2_approver_id !== null;
  switch (correction.status) {
    case 'pending_l1':
      return { l1: 'pending', l2: hasL2 ? 'pending' : 'na' };
    case 'pending_l2':
      return { l1: 'approved', l2: 'pending' };
    case 'approved':
      return { l1: 'approved', l2: hasL2 ? 'approved' : 'na' };
    case 'rejected':
      return { l1: 'rejected', l2: 'na' };
    default: // cancelled
      return { l1: 'na', l2: 'na' };
  }
}
