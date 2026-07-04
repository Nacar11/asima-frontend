import { z } from 'zod';
import { WorkScheduleSchema } from '@/features/schedule';

/**
 * Admin schedule-change (cascade) schemas. Mirror the backend
 * `ScheduleChangeImpact` / `ScheduleChangeResult` shapes from the
 * `2026-06-20-admin-schedule-change-cascade` plan. snake_case end-to-end.
 */

export const AdminScheduleListSchema = z.object({
  data: z.array(WorkScheduleSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  has_more: z.boolean(),
});
export type AdminScheduleList = z.infer<typeof AdminScheduleListSchema>;

export const AffectedRequestSchema = z.object({
  kind: z.enum(['leave', 'time_correction']),
  id: z.number().int(),
  employee_id: z.number().int(),
  status: z.string(),
  dates: z.array(z.string()),
  trigger_dates: z.array(z.string()),
  temporal: z.enum(['past', 'present', 'future']),
  decision: z.enum(['cancel', 'keep']),
  leave_type: z.string().nullable(),
  working_days: z.number().nullable(),
});
export type AffectedRequest = z.infer<typeof AffectedRequestSchema>;

export const ScheduleChangeImpactSchema = z.object({
  versioning: z.enum(['create', 'end_and_create', 'replace', 'end_only', 'delete_only', 'noop']),
  live_row_id: z.number().int().nullable(),
  affected_leaves: z.array(AffectedRequestSchema),
  affected_corrections: z.array(AffectedRequestSchema),
  freed_leave_days: z.number(),
});
export type ScheduleChangeImpact = z.infer<typeof ScheduleChangeImpactSchema>;

export const ScheduleChangeResultSchema = ScheduleChangeImpactSchema.extend({
  created_row: WorkScheduleSchema.nullable(),
});
export type ScheduleChangeResult = z.infer<typeof ScheduleChangeResultSchema>;

/** The change intent the admin composes in the editor (sent to preview/apply). */
export type ScheduleChangeIntent = {
  employee_id: number;
  day_of_week: number;
  effective_from: string;
  mode: 'modify' | 'remove';
  expected_in?: string;
  expected_out?: string;
  break_minutes?: number;
  break_start?: string | null;
};

/** One previewed cancel, echoed back to apply for the 409 drift guard. */
export type PreviewedCancel = { kind: 'leave' | 'time_correction'; id: number; status: string };

/** Build the apply snapshot from an impact's cancel lists. */
export function previewedFrom(impact: ScheduleChangeImpact): PreviewedCancel[] {
  return [...impact.affected_leaves, ...impact.affected_corrections].map((a) => ({
    kind: a.kind,
    id: a.id,
    status: a.status,
  }));
}
