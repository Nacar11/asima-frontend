import { z } from 'zod';

/**
 * Zod mirror of asima-backend/src/leave-requests. snake_case end-to-end
 * (parent CLAUDE.md). A submitted request is an audit object — the
 * requester can only cancel + resubmit, never edit (ADR 0001 / plan §2.4),
 * which is why there's no self-service update schema here.
 */

export const LEAVE_TYPES = ['vacation', 'sick', 'bereavement', 'birthday', 'emergency'] as const;
export const LeaveTypeSchema = z.enum(LEAVE_TYPES);
export type LeaveType = z.infer<typeof LeaveTypeSchema>;

export const LEAVE_STATUSES = [
  'pending_l1',
  'pending_l2',
  'approved',
  'rejected',
  'cancelled',
] as const;
export const LeaveStatusSchema = z.enum(LEAVE_STATUSES);
export type LeaveStatus = z.infer<typeof LeaveStatusSchema>;

export const DecisionPathSchema = z.enum(['chain', 'override']);

export const LeaveRequestSchema = z.object({
  id: z.number().int(),
  employee_id: z.number().int(),
  // Present on list responses (joined read-model); absent on single GET.
  employee_name: z.string().nullable().optional(),
  leave_type: LeaveTypeSchema,
  start_date: z.string(),
  end_date: z.string(),
  working_days: z.number().int(),
  reason: z.string().nullable(),
  status: LeaveStatusSchema,
  submitted_at: z.string(),
  decided_at: z.string().nullable(),
  decided_by: z.number().int().nullable(),
  decision_note: z.string().nullable(),
  decision_path: DecisionPathSchema.nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.number().int().nullable(),
  l1_approver_id: z.number().int(),
  l2_approver_id: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;

export const LeaveRequestListSchema = z.object({
  data: z.array(LeaveRequestSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  has_more: z.boolean(),
});
export type LeaveRequestList = z.infer<typeof LeaveRequestListSchema>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Self-service submit payload — mirrors SubmitLeaveRequestDto. */
export const SubmitLeaveSchema = z
  .object({
    leave_type: LeaveTypeSchema,
    start_date: z.string().regex(DATE_RE, 'Required'),
    end_date: z.string().regex(DATE_RE, 'Required'),
    reason: z.string().max(500).optional(),
  })
  .refine((v) => v.end_date >= v.start_date, {
    message: 'End date must be on or after the start date',
    path: ['end_date'],
  });
export type SubmitLeaveInput = z.infer<typeof SubmitLeaveSchema>;

/** HR pending-only edit — mirrors UpdateLeaveRequestDto. */
export const UpdateLeaveSchema = z.object({
  leave_type: LeaveTypeSchema.optional(),
  start_date: z.string().regex(DATE_RE).optional(),
  end_date: z.string().regex(DATE_RE).optional(),
  reason: z.string().max(500).nullable().optional(),
});
export type UpdateLeaveInput = z.infer<typeof UpdateLeaveSchema>;

export const RejectLeaveSchema = z.object({
  note: z.string().min(1, 'A reason is required').max(500),
});
export type RejectLeaveInput = z.infer<typeof RejectLeaveSchema>;

/** Per-type balance row — mirrors GET /users/me/leave-balances. */
export const LeaveBalanceSchema = z.object({
  leave_type: LeaveTypeSchema,
  allowance: z.number().int(),
  used: z.number().int(),
  reserved: z.number().int(),
  available: z.number().int(),
});
export type LeaveBalance = z.infer<typeof LeaveBalanceSchema>;
export const LeaveBalanceListSchema = z.array(LeaveBalanceSchema);

/** Working-day preview — mirrors GET /users/me/leave-requests/day-count. */
export const DayCountSchema = z.object({ working_days: z.number().int() });
export type DayCount = z.infer<typeof DayCountSchema>;

/** One grant in the ledger — mirrors the admin allocation history. */
export const LeaveAllocationSchema = z.object({
  id: z.number().int(),
  employee_id: z.number().int(),
  leave_type: LeaveTypeSchema,
  amount: z.number().int(),
  source: z.enum(['default', 'admin_grant']),
  reason: z.string().nullable(),
  granted_by: z.number().int().nullable(),
  created_at: z.string(),
});
export type LeaveAllocation = z.infer<typeof LeaveAllocationSchema>;
export const LeaveAllocationListSchema = z.array(LeaveAllocationSchema);

/** Admin grant payload — mirrors GrantLeaveAllocationDto. */
export const GrantAllocationSchema = z.object({
  leave_type: LeaveTypeSchema,
  amount: z.coerce.number().int().min(1, 'At least 1 day').max(365, 'At most 365 days'),
  reason: z.string().max(500).optional(),
});
export type GrantAllocationInput = z.infer<typeof GrantAllocationSchema>;

export type LeaveQuery = {
  employee_id?: number;
  status?: LeaveStatus[];
  leave_type?: LeaveType;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};
