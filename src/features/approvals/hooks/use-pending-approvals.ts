'use client';

import { useQuery } from '@tanstack/react-query';
import { approvalsApi } from '../api';
import { approvalKeys } from '../keys';
import type { PendingApprovalsQuery } from '../schemas';

export function usePendingApprovals(params: PendingApprovalsQuery) {
  return useQuery({
    queryKey: approvalKeys.pending(params),
    queryFn: () => approvalsApi.listPending(params),
  });
}
