import { ApiClient, apiClient } from '@/lib/api-client';
import {
  MyCompensationSchema,
  MyProfileSchema,
  UpdateMyProfileSchema,
  type MyCompensation,
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
   * GET /users/me/compensation — my current pay, or null when none is set
   * yet (the backend returns an empty 200 body, which the client surfaces as
   * null). Read-only; only HR can change compensation.
   */
  myCompensation(client: ApiClient = apiClient()): Promise<MyCompensation | null> {
    return client
      .get<unknown>('/users/me/compensation')
      .then((res) => (res == null ? null : MyCompensationSchema.parse(res)));
  },

  /**
   * PATCH /users/me/password — 204 on success. Backend re-verifies
   * `current_password` before hashing the new one, so a stolen access
   * token alone cannot change the password.
   */
  changePassword(input: ChangeMyPasswordRequest, client: ApiClient = apiClient()): Promise<void> {
    return client.patch<void>('/users/me/password', input).then(() => undefined);
  },
};
