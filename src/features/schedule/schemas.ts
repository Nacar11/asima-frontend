import { z } from 'zod';

/* 0 = Sunday … 6 = Saturday (backend CHECK 0..6, IsoWeekday-style not used). */
export const WorkScheduleSchema = z.object({
  id: z.number().int(),
  employee_id: z.number().int(),
  day_of_week: z.number().int().min(0).max(6),
  expected_in: z.string(),
  expected_out: z.string(),
  break_minutes: z.number().int().min(0),
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
