import { z } from 'zod';

/**
 * Mirrors `asima-backend/src/approvals/domain/pending-approval.ts`. v0
 * never produces a row, but the shape is stable and the leave module
 * will populate it.
 */
export const PendingApprovalKindSchema = z.enum(['leave', 'time_correction']);
export type PendingApprovalKind = z.infer<typeof PendingApprovalKindSchema>;

export const PendingApprovalSchema = z.object({
  id: z.number().int().positive(),
  kind: PendingApprovalKindSchema,
  employee_id: z.number().int().positive(),
  employee_name: z.string(),
  requested_at: z.string(),
  current_step: z.number().int().nonnegative(),
  current_approver_id: z.number().int().positive(),
  summary: z.string(),
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
