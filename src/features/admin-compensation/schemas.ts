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

/** Admin create payload — matches CreateCompensationDto. Omit hourly_rate to derive it. */
export const CreateCompensationSchema = z.object({
  employee_id: z.number().int(),
  monthly_salary: z.number().nonnegative(),
  hourly_rate: z.number().nonnegative().optional(),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
});
export type CreateCompensationInput = z.infer<typeof CreateCompensationSchema>;

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
