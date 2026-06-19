import { z } from 'zod';

/**
 * Mirrors `asima-backend/src/approvals/domain/pending-approval.ts`. v0
 * never produces a row, but the shape is stable and the leave module
 * will populate it.
 */
export const PendingApprovalKindSchema = z.enum(['leave', 'time_correction']);
export type PendingApprovalKind = z.infer<typeof PendingApprovalKindSchema>;

/**
 * Time-correction payload on a pending-approval row (present only for
 * `kind === 'time_correction'`). Raw ISO times so the inbox renders the
 * original→proposed in/out diff in the display timezone.
 */
export const PendingApprovalTimeCorrectionSchema = z.object({
  original_time_in: z.string().nullable(),
  original_time_out: z.string().nullable(),
  proposed_time_in: z.string(),
  proposed_time_out: z.string().nullable(),
  is_new_log: z.boolean(),
});
export type PendingApprovalTimeCorrection = z.infer<typeof PendingApprovalTimeCorrectionSchema>;

export const PendingApprovalSchema = z.object({
  id: z.number().int().positive(),
  kind: PendingApprovalKindSchema,
  employee_id: z.number().int().positive(),
  employee_name: z.string(),
  requested_at: z.string(),
  current_step: z.number().int().nonnegative(),
  current_approver_id: z.number().int().positive(),
  /** Display name of the current-step approver; backend guarantees a string ("User #<id>" fallback). */
  current_approver_name: z.string(),
  summary: z.string(),
  time_correction: PendingApprovalTimeCorrectionSchema.nullable().optional(),
});
export type PendingApproval = z.infer<typeof PendingApprovalSchema>;

export const PendingApprovalListSchema = z.object({
  data: z.array(PendingApprovalSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  has_more: z.boolean(),
});
export type PendingApprovalList = z.infer<typeof PendingApprovalListSchema>;

export type PendingApprovalsQuery = {
  /** Scope the inbox to one request kind. Omit for all kinds. */
  type?: PendingApprovalKind;
  page?: number;
  limit?: number;
};
