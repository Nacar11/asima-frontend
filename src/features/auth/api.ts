import { ApiClient, apiClient } from '@/lib/api-client';
import {
  LoginInputSchema,
  LoginResponseSchema,
  RefreshResponseSchema,
  AuthUserSchema,
  MyPermissionsSchema,
  type LoginInput,
  type LoginResponse,
  type RefreshResponse,
  type AuthUser,
  type MyPermissions,
} from './schemas';

/**
 * /auth/* endpoint wrappers. All responses are validated through Zod so
 * a server-side contract drift fails fast at the boundary, not deep
 * inside a component render.
 *
 * The `client` argument lets tests pass a freshly constructed ApiClient.
 * Default to the singleton in app code.
 */
export const authApi = {
  login(input: LoginInput, client: ApiClient = apiClient()): Promise<LoginResponse> {
    const body = LoginInputSchema.parse(input);
    return client
      .post<unknown>('/auth/login', body, { skipRefresh: true })
      .then((res) => LoginResponseSchema.parse(res));
  },

  /**
   * Sends `Authorization: Bearer <refreshToken>` because the backend's
   * JwtRefreshStrategy reads it from there (NOT from the body).
   * `skipRefresh: true` prevents an infinite refresh loop if this
   * itself returns 401.
   */
  refresh(refreshToken: string, client: ApiClient = apiClient()): Promise<RefreshResponse> {
    // Override the Bearer header for this one call without mutating the
    // client's stored access token. We do this by temporarily setting
    // it; AuthProvider re-sets the access token after the call completes.
    const previous = (client as unknown as { accessToken: string | null }).accessToken;
    client.setAccessToken(refreshToken);
    return client
      .post<unknown>('/auth/refresh', undefined, { skipRefresh: true })
      .then((res) => RefreshResponseSchema.parse(res))
      .finally(() => client.setAccessToken(previous));
  },

  logout(client: ApiClient = apiClient()): Promise<void> {
    // Backend returns 204; the apiClient.handleResponse maps that to undefined.
    return client.post<void>('/auth/logout').catch(() => {
      // Stateless logout — if the network is dead we still want the
      // frontend to drop tokens. AuthProvider handles that regardless.
    });
  },

  me(client: ApiClient = apiClient()): Promise<AuthUser> {
    return client.get<unknown>('/auth/me').then((res) => AuthUserSchema.parse(res));
  },

  /**
   * Flat permission codes the current user can act on. Drives UI gating
   * per the parent CLAUDE.md ("Frontend should drive UI gating from
   * /users/me/permissions — never parse role.permissions client-side").
   */
  permissions(client: ApiClient = apiClient()): Promise<MyPermissions> {
    return client
      .get<unknown>('/users/me/permissions')
      .then((res) => MyPermissionsSchema.parse(res));
  },
};
