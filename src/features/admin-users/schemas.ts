import { z } from 'zod';
import { PASSWORD_COMPLEXITY_MESSAGE, PASSWORD_COMPLEXITY_REGEX } from '@/features/profile';

/* Mirrors asima-backend/src/roles/domain/role.ts (slim — no nested perms). */
export const AdminRoleSlimSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});
export type AdminRoleSlim = z.infer<typeof AdminRoleSlimSchema>;

/* Mirrors asima-backend/src/users/domain/user.ts — admin list/get response. */
export const AdminUserSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  title: z.string().nullable(),
  role_id: z.number().int(),
  role: AdminRoleSlimSchema,
  system_admin: z.boolean(),
  is_active: z.boolean(),
  last_login_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});
export type AdminUser = z.infer<typeof AdminUserSchema>;

export const AdminUserListSchema = z.object({
  data: z.array(AdminUserSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  has_more: z.boolean(),
});
export type AdminUserList = z.infer<typeof AdminUserListSchema>;

/* Wide create payload — matches CreateUserDto on the backend. */
export const CreateAdminUserSchema = z.object({
  email: z.string().email('Enter a valid email').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(PASSWORD_COMPLEXITY_REGEX, PASSWORD_COMPLEXITY_MESSAGE),
  first_name: z.string().min(1, 'Required').max(100),
  last_name: z.string().min(1, 'Required').max(100),
  title: z.string().max(100).nullable().optional(),
  role_id: z.number().int(),
  is_active: z.boolean().optional(),
});
export type CreateAdminUserInput = z.infer<typeof CreateAdminUserSchema>;

/* Update — no email (needs verification flow), no password (own endpoint). */
export const UpdateAdminUserSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  title: z.string().max(100).nullable().optional(),
  role_id: z.number().int().optional(),
  is_active: z.boolean().optional(),
});
export type UpdateAdminUserInput = z.infer<typeof UpdateAdminUserSchema>;

export const ResetUserPasswordSchema = z.object({
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(PASSWORD_COMPLEXITY_REGEX, PASSWORD_COMPLEXITY_MESSAGE),
});
export type ResetUserPasswordInput = z.infer<typeof ResetUserPasswordSchema>;

export type AdminUsersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role_id?: number;
  is_active?: boolean;
};
