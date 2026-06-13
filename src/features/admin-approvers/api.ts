import { ApiClient, apiClient } from '@/lib/api-client';
import {
  ActiveChainRowsSchema,
  ActiveChainSchema,
  ApproverIdsSchema,
  BulkAssignResultSchema,
  BulkReassignResultSchema,
  EmployeeChainListSchema,
  type ActiveChain,
  type ActiveChainRows,
  type BulkAssignInput,
  type BulkAssignResult,
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

  bulkAssign(input: BulkAssignInput, client: ApiClient = apiClient()): Promise<BulkAssignResult> {
    return client
      .post<unknown>('/admin/approvers/bulk-assign', input)
      .then((res) => BulkAssignResultSchema.parse(res));
  },

  /**
   * Every employee id matching the given filters, in one call — backs the
   * "select all unassigned" action. Uses the lean server endpoint (no
   * approver joins, no pagination), so there is no client-side paging loop
   * and the result spans the whole filtered set, not just one page.
   */
  allMatchingIds(
    params: EmployeeChainQuery = {},
    client: ApiClient = apiClient(),
  ): Promise<number[]> {
    return client
      .get<unknown>('/admin/approvers/ids', { params })
      .then((res) => ApproverIdsSchema.parse(res).employee_ids);
  },
};
