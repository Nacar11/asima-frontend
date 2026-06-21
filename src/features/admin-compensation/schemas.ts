import { z } from 'zod';

/**
 * Mirrors asima-backend/src/compensation/domain/compensation.ts. snake_case
 * end-to-end. Money columns arrive as numbers (the backend's numeric
 * transformer parses pg's string form). The active row (effective_to === null)
 * is the current rate — the backend disallows future-dating.
 */
export const CompensationSchema = z.object({
  id: z.number().int(),
  employee_id: z.number().int(),
  monthly_salary: z.number(),
  hourly_rate: z.number(),
  hourly_rate_is_overridden: z.boolean(),
  currency: z.string().default('PHP'),
  effective_from: z.string(),
  effective_to: z.string().nullable(),
  created_by: z.number().int().nullable(),
  updated_by: z.number().int().nullable(),
  deleted_by: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});
export type Compensation = z.infer<typeof CompensationSchema>;

/**
 * One audit-trail entry — mirrors the backend CompensationAudit domain. Append
 * only, with before→after of the money + effective_from on each write. `before_*`
 * is null on a create; `after_*` is null on a delete.
 */
export const CompensationAuditSchema = z.object({
  id: z.number().int(),
  compensation_id: z.number().int(),
  employee_id: z.number().int(),
  action: z.enum(['created', 'updated', 'deleted']),
  before_monthly_salary: z.number().nullable(),
  after_monthly_salary: z.number().nullable(),
  before_hourly_rate: z.number().nullable(),
  after_hourly_rate: z.number().nullable(),
  before_effective_from: z.string().nullable(),
  after_effective_from: z.string().nullable(),
  actor_id: z.number().int().nullable(),
  created_at: z.string(),
});
export type CompensationAudit = z.infer<typeof CompensationAuditSchema>;

/** Admin create payload — matches CreateCompensationDto. Omit hourly_rate to derive it. */
export const CreateCompensationSchema = z.object({
  employee_id: z.number().int(),
  monthly_salary: z.number().nonnegative(),
  hourly_rate: z.number().nonnegative().optional(),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
});
export type CreateCompensationInput = z.infer<typeof CreateCompensationSchema>;

/** Admin bulk set-pay payload — matches BulkCreateCompensationDto (all-or-nothing). */
export const BulkCreateCompensationSchema = z.object({
  items: z.array(CreateCompensationSchema).min(1),
});
export type BulkCreateCompensationInput = z.infer<typeof BulkCreateCompensationSchema>;

/** Admin in-place correction — matches UpdateCompensationDto. */
export const UpdateCompensationSchema = z.object({
  monthly_salary: z.number().nonnegative().optional(),
  hourly_rate: z.number().nonnegative().optional(),
  effective_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type UpdateCompensationInput = z.infer<typeof UpdateCompensationSchema>;
