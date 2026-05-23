import { z } from 'zod';

/**
 * Wire shapes for /auth/*. Snake_case end-to-end — matches the backend
 * domain classes verbatim. SPEC §5 ("Snake_case at the API boundary").
 */

/** /auth/me response — slim user with role.id + role.name only. */
export const AuthUserSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  title: z.string().nullable(),
  is_active: z.boolean(),
  system_admin: z.boolean(),
  role: z.object({
    id: z.number().int(),
    name: z.string(),
  }),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const LoginResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  token_expires_in: z.number().int().positive(),
  user: AuthUserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RefreshResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  token_expires_in: z.number().int().positive(),
});
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

/** /users/me/permissions — flat array of RESOURCE:Action codes. */
export const MyPermissionsSchema = z.object({
  permissions: z.array(z.string()),
});
export type MyPermissions = z.infer<typeof MyPermissionsSchema>;
