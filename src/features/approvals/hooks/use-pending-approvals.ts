'use client';

import { useQuery } from '@tanstack/react-query';
import { approvalsApi } from '@/features/approvals/api';
import type { PendingApprovalsQuery } from '@/features/approvals/schemas';

export function usePendingApprovals(params: PendingApprovalsQuery) {
  return useQuery({
    queryKey: ['approvals', 'pending', params] as const,
    queryFn: () => approvalsApi.listPending(params),
  });
}
