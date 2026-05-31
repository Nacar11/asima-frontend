import { z } from 'zod';

/**
 * Zod mirror of asima-backend/src/time-correction-requests. Same 2-step
 * lifecycle as leave; snake_case end-to-end. A submitted request is an
 * audit object — cancel + resubmit, no self-edit (ADR 0001 / plan §2.4).
 *
 * `target_entry_id` is null for a missed-punch (no row to correct; a new
 * time_entries row is created on approval).
 */

export const TC_STATUSES = [
  'pending_l1',
  'pending_l2',
  'approved',
  'rejected',
  'cancelled',
] as const;
export const TcStatusSchema = z.enum(TC_STATUSES);
export type TcStatus = z.infer<typeof TcStatusSchema>;

export const TcDecisionPathSchema = z.enum(['chain', 'override']);

export const TimeCorrectionSchema = z.object({
  id: z.number().int(),
  employee_id: z.number().int(),
  target_entry_id: z.number().int().nullable(),
  work_date: z.string(),
  proposed_time_in: z.string(),
  proposed_time_out: z.string().nullable(),
  reason: z.string(),
  status: TcStatusSchema,
  submitted_at: z.string(),
  decided_at: z.string().nullable(),
  decided_by: z.number().int().nullable(),
  decision_note: z.string().nullable(),
  decision_path: TcDecisionPathSchema.nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.number().int().nullable(),
  l1_approver_id: z.number().int(),
  l2_approver_id: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type TimeCorrectionRequest = z.infer<typeof TimeCorrectionSchema>;

export const TimeCorrectionListSchema = z.object({
  data: z.array(TimeCorrectionSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  has_more: z.boolean(),
});
export type TimeCorrectionList = z.infer<typeof TimeCorrectionListSchema>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Self-service submit payload. Times are local `datetime-local` strings
 * in the form; the api layer converts them to ISO before sending.
 */
export const SubmitCorrectionSchema = z
  .object({
    target_entry_id: z.number().int().positive().nullable().optional(),
    work_date: z.string().regex(DATE_RE, 'Required'),
    proposed_time_in: z.string().min(1, 'Required'),
    proposed_time_out: z.string().optional(),
    reason: z.string().min(1, 'A reason is required').max(500),
  })
  .refine(
    (v) => !v.proposed_time_out || v.proposed_time_out > v.proposed_time_in,
    { message: 'Time out must be after time in', path: ['proposed_time_out'] },
  );
export type SubmitCorrectionInput = z.infer<typeof SubmitCorrectionSchema>;

export const UpdateCorrectionSchema = z.object({
  work_date: z.string().regex(DATE_RE).optional(),
  proposed_time_in: z.string().optional(),
  proposed_time_out: z.string().nullable().optional(),
  reason: z.string().min(1).max(500).optional(),
});
export type UpdateCorrectionInput = z.infer<typeof UpdateCorrectionSchema>;

export const RejectCorrectionSchema = z.object({
  note: z.string().min(1, 'A reason is required').max(500),
});

export type TcQuery = {
  employee_id?: number;
  status?: TcStatus[];
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};
