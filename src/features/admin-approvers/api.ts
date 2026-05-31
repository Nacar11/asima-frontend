import { ApiClient, apiClient } from '@/lib/api-client';
import {
  ActiveChainRowsSchema,
  ActiveChainSchema,
  BulkReassignResultSchema,
  EmployeeChainListSchema,
  type ActiveChain,
  type ActiveChainRows,
  type BulkReassignInput,
  type BulkReassignResult,
  type EmployeeChainList,
  type EmployeeChainQuery,
  type SetChainInput,
} from './schemas';

/**
 * /admin/approvers — per-employee approval-chain management. Gated
 * server-side by APPROVAL_CHAIN:{View,Update} (PermissionsGuard). The
 * frontend wraps the surface in <RequirePermission> for UX; the server
 * is the security boundary.
 *
 * Reassignment is logical-end + insert on the backend — these calls are
 * thin pass-throughs; the versioning lives in the service.
 */
export const adminApproversApi = {
  list(
    params: EmployeeChainQuery = {},
    client: ApiClient = apiClient(),
  ): Promise<EmployeeChainList> {
    return client
      .get<unknown>('/admin/approvers', { params })
      .then((res) => EmployeeChainListSchema.parse(res));
  },

  getOne(employeeId: number, client: ApiClient = apiClient()): Promise<ActiveChainRows> {
    return client
      .get<unknown>(`/admin/approvers/${employeeId}`)
      .then((res) => ActiveChainRowsSchema.parse(res));
  },

  setChain(
    employeeId: number,
    input: SetChainInput,
    client: ApiClient = apiClient(),
  ): Promise<ActiveChain> {
    return client
      .patch<unknown>(`/admin/approvers/${employeeId}`, input)
      .then((res) => ActiveChainSchema.parse(res));
  },

  bulkReassign(
    input: BulkReassignInput,
    client: ApiClient = apiClient(),
  ): Promise<BulkReassignResult> {
    return client
      .post<unknown>('/admin/approvers/bulk-reassign', input)
      .then((res) => BulkReassignResultSchema.parse(res));
  },
};
