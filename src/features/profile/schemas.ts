import { z } from 'zod';
import { AuthUserSchema } from '@/features/auth/schemas';

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
