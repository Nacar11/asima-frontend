import { ApiClient, apiClient } from '@/lib/api-client';
import {
  MyProfileSchema,
  UpdateMyProfileSchema,
  type MyProfile,
  type UpdateMyProfileInput,
} from './schemas';

export type ChangeMyPasswordRequest = {
  current_password: string;
  new_password: string;
};

export const profileApi = {
  me(client: ApiClient = apiClient()): Promise<MyProfile> {
    return client.get<unknown>('/users/me').then((res) => MyProfileSchema.parse(res));
  },

  update(input: UpdateMyProfileInput, client: ApiClient = apiClient()): Promise<MyProfile> {
    const body = UpdateMyProfileSchema.parse(input);
    return client.patch<unknown>('/users/me', body).then((res) => MyProfileSchema.parse(res));
  },

  /**
   * PATCH /users/me/password — 204 on success. Backend re-verifies
   * `current_password` before hashing the new one, so a stolen access
   * token alone cannot change the password.
   */
  changePassword(input: ChangeMyPasswordRequest, client: ApiClient = apiClient()): Promise<void> {
    return client
      .patch<void>('/users/me/password', input)
      .then(() => undefined);
  },
};
