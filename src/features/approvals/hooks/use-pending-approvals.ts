'use client';

import { useQuery } from '@tanstack/react-query';
import { approvalsApi } from '@/features/approvals/api';
import { approvalKeys } from '@/features/approvals/keys';
import type { PendingApprovalsQuery } from '@/features/approvals/schemas';

export function usePendingApprovals(params: PendingApprovalsQuery) {
  return useQuery({
    queryKey: approvalKeys.pending(params),
    queryFn: () => approvalsApi.listPending(params),
  });
}
