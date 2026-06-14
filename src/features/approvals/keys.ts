import type { QueryKey } from '@tanstack/react-query';
import type { PendingApprovalsQuery } from './schemas';

/** Cache-key factory for the approvals slice. The only place these keys are defined. */
export const approvalKeys = {
  all: ['approvals'] as const,
  pending: (params: PendingApprovalsQuery): QueryKey => [...approvalKeys.all, 'pending', params],
};
