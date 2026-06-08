import { ApiClient, apiClient } from '@/lib/api-client';
import {
  DayCountSchema,
  LeaveAllocationListSchema,
  LeaveAllocationSchema,
  LeaveBalanceListSchema,
  LeaveRequestListSchema,
  LeaveRequestSchema,
  type DayCount,
  type DayPortion,
  type GrantAllocationInput,
  type LeaveAllocation,
  type LeaveBalance,
  type LeaveQuery,
  type LeaveRequest,
  type LeaveRequestList,
  type LeaveType,
  type SubmitLeaveInput,
  type UpdateLeaveInput,
} from './schemas';

/** Flatten a LeaveQuery into api-client params (status[] → comma string). */
function toParams(query: LeaveQuery): Record<string, string | number | undefined> {
  const { status, ...rest } = query;
  return {
    ...rest,
    status: status && status.length > 0 ? status.join(',') : undefined,
  };
}

/**
 * Leave-requests client. Three audiences, matching the backend split
 * (plan §3.4): `me` (self-service, identity from JWT), `admin` (HR
 * ViewAll/Update/Delete), and the top-level approve/reject the *approver*
 * calls. The server is the security boundary; route gating here is UX.
 */
export const leaveApi = {
  me: {
    list(query: LeaveQuery = {}, client: ApiClient = apiClient()): Promise<LeaveRequestList> {
      return client
        .get<unknown>('/users/me/leave-requests', { params: toParams(query) })
        .then((res) => LeaveRequestListSchema.parse(res));
    },
    submit(input: SubmitLeaveInput, client: ApiClient = apiClient()): Promise<LeaveRequest> {
      return client
        .post<unknown>('/users/me/leave-requests', input)
        .then((res) => LeaveRequestSchema.parse(res));
    },
    getOne(id: number, client: ApiClient = apiClient()): Promise<LeaveRequest> {
      return client
        .get<unknown>(`/users/me/leave-requests/${id}`)
        .then((res) => LeaveRequestSchema.parse(res));
    },
    cancel(id: number, client: ApiClient = apiClient()): Promise<LeaveRequest> {
      return client
        .post<unknown>(`/users/me/leave-requests/${id}/cancel`)
        .then((res) => LeaveRequestSchema.parse(res));
    },
    balances(client: ApiClient = apiClient()): Promise<LeaveBalance[]> {
      return client
        .get<unknown>('/users/me/leave-balances')
        .then((res) => LeaveBalanceListSchema.parse(res));
    },
    /** Preview chargeable working days (+ half-day window); throws ApiError (422) on a D8 violation. */
    dayCountPreview(
      start_date: string,
      end_date: string,
      opts: { day_portion?: DayPortion; leave_type?: LeaveType } = {},
      client: ApiClient = apiClient(),
    ): Promise<DayCount> {
      return client
        .get<unknown>('/users/me/leave-requests/day-count', {
          params: {
            start_date,
            end_date,
            day_portion: opts.day_portion,
            leave_type: opts.leave_type,
          },
        })
        .then((res) => DayCountSchema.parse(res));
    },
  },

  admin: {
    list(query: LeaveQuery = {}, client: ApiClient = apiClient()): Promise<LeaveRequestList> {
      return client
        .get<unknown>('/admin/leave-requests', { params: toParams(query) })
        .then((res) => LeaveRequestListSchema.parse(res));
    },
    getOne(id: number, client: ApiClient = apiClient()): Promise<LeaveRequest> {
      return client
        .get<unknown>(`/admin/leave-requests/${id}`)
        .then((res) => LeaveRequestSchema.parse(res));
    },
    update(
      id: number,
      input: UpdateLeaveInput,
      client: ApiClient = apiClient(),
    ): Promise<LeaveRequest> {
      return client
        .patch<unknown>(`/admin/leave-requests/${id}`, input)
        .then((res) => LeaveRequestSchema.parse(res));
    },
    cancel(id: number, client: ApiClient = apiClient()): Promise<LeaveRequest> {
      return client
        .delete<unknown>(`/admin/leave-requests/${id}`)
        .then((res) => LeaveRequestSchema.parse(res));
    },
    balances(employeeId: number, client: ApiClient = apiClient()): Promise<LeaveBalance[]> {
      return client
        .get<unknown>(`/admin/users/${employeeId}/leave-balances`)
        .then((res) => LeaveBalanceListSchema.parse(res));
    },
    allocations(employeeId: number, client: ApiClient = apiClient()): Promise<LeaveAllocation[]> {
      return client
        .get<unknown>(`/admin/users/${employeeId}/leave-allocations`)
        .then((res) => LeaveAllocationListSchema.parse(res));
    },
    grant(
      employeeId: number,
      input: GrantAllocationInput,
      client: ApiClient = apiClient(),
    ): Promise<LeaveAllocation> {
      return client
        .post<unknown>(`/admin/users/${employeeId}/leave-allocations`, input)
        .then((res) => LeaveAllocationSchema.parse(res));
    },
  },

  approve(id: number, client: ApiClient = apiClient()): Promise<LeaveRequest> {
    return client
      .post<unknown>(`/leave-requests/${id}/approve`)
      .then((res) => LeaveRequestSchema.parse(res));
  },

  reject(id: number, note: string, client: ApiClient = apiClient()): Promise<LeaveRequest> {
    return client
      .post<unknown>(`/leave-requests/${id}/reject`, { note })
      .then((res) => LeaveRequestSchema.parse(res));
  },
};
