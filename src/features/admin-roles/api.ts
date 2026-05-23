import { z } from 'zod';
import { ApiClient, apiClient } from '@/lib/api-client';

/**
 * Slim role list for the admin-users create/edit dialogs (role dropdown).
 * Full admin-roles CRUD lives in its own feature when that surface ships.
 */
export const AdminRoleSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
});
export type AdminRole = z.infer<typeof AdminRoleSchema>;

export const AdminRoleListSchema = z.object({
  data: z.array(AdminRoleSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  has_more: z.boolean(),
});
export type AdminRoleList = z.infer<typeof AdminRoleListSchema>;

export const adminRolesApi = {
  list(client: ApiClient = apiClient()): Promise<AdminRoleList> {
    return client
      .get<unknown>('/admin/roles', { params: { limit: 100 } })
      .then((res) => AdminRoleListSchema.parse(res));
  },
};
