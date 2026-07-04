import { z } from 'zod';
import { AuthUserSchema } from '@/features/auth';

/*
 * The full /users/me payload returned by the backend includes the
 * nested role.permissions array; we don't need it on the client
 * because permission gating is driven by /users/me/permissions
 * (flat string array). The narrow AuthUserSchema is enough.
 */
export const MyProfileSchema = AuthUserSchema;
export type MyProfile = z.infer<typeof MyProfileSchema>;

/* PATCH /users/me — narrow allowlist matching UpdateMeDto. */
export const UpdateMyProfileSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(100, 'First name is too long'),
  last_name: z.string().trim().min(1, 'Last name is required').max(100, 'Last name is too long'),
});
export type UpdateMyProfileInput = z.infer<typeof UpdateMyProfileSchema>;

/*
 * GET /users/me/compensation — read-only current pay (or null for a new hire
 * with none set yet). Only the display fields are validated; zod strips the
 * rest of the Compensation payload.
 */
export const MyCompensationSchema = z.object({
  id: z.number().int(),
  monthly_salary: z.number(),
  hourly_rate: z.number(),
  hourly_rate_is_overridden: z.boolean(),
  currency: z.string().default('PHP'),
  effective_from: z.string(),
});
export type MyCompensation = z.infer<typeof MyCompensationSchema>;
