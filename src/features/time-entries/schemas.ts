import { z } from 'zod';

/* Mirrors src/time-entries/time-entries.constants.ts (TIME_ENTRY_SOURCES, TIME_ENTRY_STATUSES). */
export const TimeEntrySourceSchema = z.enum(['manual', 'biometric', 'admin']);
export type TimeEntrySource = z.infer<typeof TimeEntrySourceSchema>;

export const TimeEntryStatusSchema = z.enum(['open', 'confirmed']);
export type TimeEntryStatus = z.infer<typeof TimeEntryStatusSchema>;

export const TimeEntrySchema = z.object({
  id: z.number().int(),
  employee_id: z.number().int(),
  work_date: z.string(), // YYYY-MM-DD
  time_in: z.string(),   // ISO 8601 datetime
  time_out: z.string().nullable(),
  source: TimeEntrySourceSchema,
  status: TimeEntryStatusSchema,
  notes: z.string().nullable(),
  created_by: z.number().int().nullable(),
  updated_by: z.number().int().nullable(),
  deleted_by: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});
export type TimeEntry = z.infer<typeof TimeEntrySchema>;

/** Backend paginated envelope. */
export const TimeEntryListSchema = z.object({
  data: z.array(TimeEntrySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  has_more: z.boolean(),
});
export type TimeEntryList = z.infer<typeof TimeEntryListSchema>;

export type ListMyTimeEntriesParams = {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

/**
 * Compute the duration in minutes between time_in and time_out. Returns
 * null for open entries (still clocked in). Caller decides how to display.
 */
export function durationMinutes(entry: TimeEntry): number | null {
  if (!entry.time_out) return null;
  const inMs = new Date(entry.time_in).getTime();
  const outMs = new Date(entry.time_out).getTime();
  if (!Number.isFinite(inMs) || !Number.isFinite(outMs)) return null;
  return Math.max(0, Math.round((outMs - inMs) / 60_000));
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}
