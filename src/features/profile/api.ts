import { ApiClient, apiClient } from '@/lib/api-client';
import {
  MyProfileSchema,
  UpdateMyProfileSchema,
  type MyProfile,
  type UpdateMyProfileInput,
} from './schemas';
import { MyPermissionsSchema, type MyPermissions } from '@/features/auth/schemas';

export const profileApi = {
  me(client: ApiClient = apiClient()): Promise<MyProfile> {
    return client.get<unknown>('/users/me').then((res) => MyProfileSchema.parse(res));
  },

  permissions(client: ApiClient = apiClient()): Promise<MyPermissions> {
    return client
      .get<unknown>('/users/me/permissions')
      .then((res) => MyPermissionsSchema.parse(res));
  },

  update(input: UpdateMyProfileInput, client: ApiClient = apiClient()): Promise<MyProfile> {
    const body = UpdateMyProfileSchema.parse(input);
    return client.patch<unknown>('/users/me', body).then((res) => MyProfileSchema.parse(res));
  },
};
