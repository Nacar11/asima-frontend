import { formatTimeInTz } from '@/lib/format';
import type { WorkSchedule } from '@/features/schedule/schemas';
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
