import { z } from 'zod';

/* 0 = Sunday … 6 = Saturday (backend CHECK 0..6, IsoWeekday-style not used). */
export const WorkScheduleSchema = z.object({
  id: z.number().int(),
  employee_id: z.number().int(),
  day_of_week: z.number().int().min(0).max(6),
  expected_in: z.string(),
  expected_out: z.string(),
  break_minutes: z.number().int().min(0),
  // Break start (HH:MM:SS), null when break_minutes = 0.
  break_start: z.string().nullable(),
  effective_from: z.string(),
  effective_to: z.string().nullable(),
  created_by: z.number().int().nullable(),
  updated_by: z.number().int().nullable(),
  deleted_by: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});
export type WorkSchedule = z.infer<typeof WorkScheduleSchema>;

export const MyScheduleSchema = z.array(WorkScheduleSchema);

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function dayName(dow: number): string {
  return DAY_NAMES[dow] ?? `Day ${dow}`;
}

/**
 * "09:00:00" → "09:00". Backend stores TIME values which Postgres returns
 * as HH:MM:SS strings; the UI only needs HH:MM. (Doing this here so
 * cards / calendar widgets don't each re-implement the trim.)
 */
export function trimSeconds(timeStr: string): string {
  return timeStr.length >= 5 ? timeStr.slice(0, 5) : timeStr;
}

/**
 * Combined break column: `break_start`–`break_end (N min)`, e.g.
 * `"13:00–14:00 (60 min)"`. The end is derived (`break_start + break_minutes`).
 * Returns `"—"` when there is no break. 24h to match the START/END columns.
 */
export function formatBreak(break_start: string | null, break_minutes: number): string {
  if (!break_start || break_minutes <= 0) return '—';
  const parts = break_start.split(':');
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  const endTotal = h * 60 + m + break_minutes;
  const endH = Math.floor(endTotal / 60) % 24;
  const endM = endTotal % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${trimSeconds(break_start)}–${pad(endH)}:${pad(endM)} (${break_minutes} min)`;
}
