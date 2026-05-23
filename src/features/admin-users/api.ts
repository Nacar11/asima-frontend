import { ApiClient, apiClient } from '@/lib/api-client';
import {
  AdminUserSchema,
  AdminUserListSchema,
  CreateAdminUserSchema,
  UpdateAdminUserSchema,
  ResetUserPasswordSchema,
  type AdminUser,
  type AdminUserList,
  type AdminUsersQuery,
  type CreateAdminUserInput,
  type UpdateAdminUserInput,
  type ResetUserPasswordInput,
} from './schemas';

/**
 * /admin/users CRUD. Gated server-side by USER:{View,Create,Update,Delete}
 * via `PermissionsGuard`. Frontend wraps the page in <RequirePermission>
 * for friendly UX, but this client trusts the server to enforce.
 */
export const adminUsersApi = {
  list(
    params: AdminUsersQuery = {},
    client: ApiClient = apiClient(),
  ): Promise<AdminUserList> {
    return client
      .get<unknown>('/admin/users', { params })
      .then((res) => AdminUserListSchema.parse(res));
  },

  get(id: number, client: ApiClient = apiClient()): Promise<AdminUser> {
    return client
      .get<unknown>(`/admin/users/${id}`)
      .then((res) => AdminUserSchema.parse(res));
  },

  create(
    input: CreateAdminUserInput,
    client: ApiClient = apiClient(),
  ): Promise<AdminUser> {
    const body = CreateAdminUserSchema.parse(input);
    return client
      .post<unknown>('/admin/users', body)
      .then((res) => AdminUserSchema.parse(res));
  },

  update(
    id: number,
    input: UpdateAdminUserInput,
    client: ApiClient = apiClient(),
  ): Promise<AdminUser> {
    const body = UpdateAdminUserSchema.parse(input);
    return client
      .patch<unknown>(`/admin/users/${id}`, body)
      .then((res) => AdminUserSchema.parse(res));
  },

  resetPassword(
    id: number,
    input: ResetUserPasswordInput,
    client: ApiClient = apiClient(),
  ): Promise<void> {
    const body = ResetUserPasswordSchema.parse(input);
    return client.post<void>(`/admin/users/${id}/reset-password`, body).then(() => undefined);
  },

  remove(id: number, client: ApiClient = apiClient()): Promise<void> {
    return client.delete<void>(`/admin/users/${id}`).then(() => undefined);
  },
};
