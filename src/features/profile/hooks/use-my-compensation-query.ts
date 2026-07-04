'use client';

import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api';
import { profileKeys } from '../keys';

/**
 * My current compensation (read-only). `enabled` gates the fetch on the
 * caller's COMPENSATION:ViewOwn permission so we never fire a request that
 * would 403.
 */
export function useMyCompensation(enabled: boolean) {
  return useQuery({
    queryKey: profileKeys.compensation(),
    queryFn: () => profileApi.myCompensation(),
    enabled,
  });
}
