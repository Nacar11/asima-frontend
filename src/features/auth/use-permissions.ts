'use client';

import { useQuery } from '@tanstack/react-query';
import { authApi } from './api';
import { authKeys } from './keys';
import { useAuth } from './use-auth';

/**
 * Fetches and caches the flat array of permission codes the current
 * user can act on. Gated on auth status so we never fire while
 * unauthenticated (the endpoint would return 401 and pollute the
 * cache with an error).
 *
 * 5-minute staleTime: permissions change only on role edits, which are
 * rare and admin-initiated — no need to refetch on every nav. A full
 * reload will invalidate.
 */
export function usePermissions() {
  const { status } = useAuth();
  const query = useQuery({
    queryKey: authKeys.permissions(),
    queryFn: () => authApi.permissions(),
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000,
  });

  return {
    permissions: query.data?.permissions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
