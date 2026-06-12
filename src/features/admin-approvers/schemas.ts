import { z } from 'zod';

/**
 * Zod mirror of the backend approval-chains contract
 * (asima-backend/src/approval-chains). The "Approvers" surface — distinct
 * from role/permission (ADR 0001): the chain decides WHO approves THIS
 * employee's request, orthogonal to whether a role CAN approve at all.
 *
 * snake_case end-to-end per the parent CLAUDE.md API conventions.
 */

/** One row in `GET /admin/approvers` — employee + their current L1/L2. */
export const EmployeeChainViewSchema = z.object({
  employee_id: z.number().int(),
  employee_name: z.string(),
  employee_email: z.string(),
  l1_approver_id: z.number().int().nullable(),
  l1_approver_name: z.string().nullable(),
  l2_approver_id: z.number().int().nullable(),
  l2_approver_name: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type EmployeeChainView = z.infer<typeof EmployeeChainViewSchema>;

export const EmployeeChainListSchema = z.object({
  data: z.array(EmployeeChainViewSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  has_more: z.boolean(),
});
export type EmployeeChainList = z.infer<typeof EmployeeChainListSchema>;

/** A single versioned assignment row (logical-end + insert model). */
export const ApprovalChainRowSchema = z.object({
  id: z.number().int(),
  employee_id: z.number().int(),
  step: z.number().int(),
  approver_id: z.number().int(),
  effective_at: z.string(),
  ended_at: z.string().nullable(),
  created_by: z.number().int().nullable(),
  updated_by: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ApprovalChainRow = z.infer<typeof ApprovalChainRowSchema>;

/** `GET /admin/approvers/:employee_id` — active rows for the detail view. */
export const ActiveChainRowsSchema = z.object({
  employee_id: z.number().int(),
  l1: ApprovalChainRowSchema.nullable(),
  l2: ApprovalChainRowSchema.nullable(),
});
export type ActiveChainRows = z.infer<typeof ActiveChainRowsSchema>;

/** Flat active L1/L2 lookup returned by `PATCH /admin/approvers/:id`. */
export const ActiveChainSchema = z.object({
  l1_approver_id: z.number().int().nullable(),
  l2_approver_id: z.number().int().nullable(),
});
export type ActiveChain = z.infer<typeof ActiveChainSchema>;

export const BulkReassignResultSchema = z.object({
  reassigned: z.number().int().nonnegative(),
  skipped: z.array(z.number().int()),
});
export type BulkReassignResult = z.infer<typeof BulkReassignResultSchema>;

/**
 * `PATCH /admin/approvers/:employee_id` payload. Tri-state per field:
 *   - omitted → leave that step unchanged
 *   - null    → clear that step
 *   - number  → set that step's approver
 */
export const SetChainSchema = z.object({
  l1_approver_id: z.number().int().positive().nullable().optional(),
  l2_approver_id: z.number().int().positive().nullable().optional(),
});
export type SetChainInput = z.infer<typeof SetChainSchema>;

export const BulkReassignSchema = z.object({
  from_approver_id: z.number().int().positive(),
  to_approver_id: z.number().int().positive(),
});
export type BulkReassignInput = z.infer<typeof BulkReassignSchema>;

/**
 * `POST /admin/approvers/bulk-assign` payload. Assign an L1 (required) and
 * optional L2 to an explicit list of employees. Mirrors the backend
 * `BulkAssignDto`: assigning a step OVERWRITES any existing approver there;
 * self-approval rows are skipped server-side, not rejected.
 */
export const BulkAssignSchema = z.object({
  employee_ids: z.array(z.number().int().positive()).min(1),
  l1_approver_id: z.number().int().positive(),
  l2_approver_id: z.number().int().positive().optional(),
});
export type BulkAssignInput = z.infer<typeof BulkAssignSchema>;

export const BulkAssignResultSchema = z.object({
  assigned: z.number().int().nonnegative(),
  skipped: z.array(
    z.object({ employee_id: z.number().int(), reason: z.string() }),
  ),
});
export type BulkAssignResult = z.infer<typeof BulkAssignResultSchema>;

/** `GET /admin/approvers/ids` — lean id envelope backing "select all". */
export const ApproverIdsSchema = z.object({
  employee_ids: z.array(z.number().int()),
});
export type ApproverIds = z.infer<typeof ApproverIdsSchema>;

export type EmployeeChainQuery = {
  page?: number;
  limit?: number;
  search?: string;
  unassigned?: boolean;
};
