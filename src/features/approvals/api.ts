import { ApiClient, apiClient } from '@/lib/api-client';
import {
  PendingApprovalListSchema,
  type PendingApprovalList,
  type PendingApprovalsQuery,
} from './schemas';

/**
 * Cross-resource approvals inbox. Gated server-side by `APPROVAL:View`.
 * Returns rows where the caller is the current-step approver (or all
 * pending, with `APPROVAL:ApproveAny`). Approve/reject are not here —
 * they live per-resource and are dispatched by kind via
 * `features/approvals/actions.ts`.
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
