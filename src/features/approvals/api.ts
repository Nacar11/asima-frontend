import { ApiClient, apiClient } from '@/lib/api-client';
import {
  PendingApprovalListSchema,
  type PendingApprovalList,
  type PendingApprovalsQuery,
} from './schemas';

/**
 * Cross-resource approvals inbox. Gated server-side by `APPROVAL:View`.
 * v0 always returns an empty paginated payload — see backend spec.
 */
export const approvalsApi = {
  listPending(
    params: PendingApprovalsQuery = {},
    client: ApiClient = apiClient(),
  ): Promise<PendingApprovalList> {
    return client
      .get<unknown>('/approvals/pending', { params })
      .then((res) => PendingApprovalListSchema.parse(res));
  },
};
