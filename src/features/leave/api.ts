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
  type FileVersion,
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
    /**
     * Submit a leave request. sick/bereavement carry a mandatory `file`,
     * sent as multipart/form-data; every other type posts JSON. The server
     * enforces the rule either way (this is UX, not the boundary).
     */
    submit(
      input: SubmitLeaveInput,
      file?: File | null,
      client: ApiClient = apiClient(),
    ): Promise<LeaveRequest> {
      if (file) {
        const form = new FormData();
        form.set('leave_type', input.leave_type);
        form.set('start_date', input.start_date);
        form.set('end_date', input.end_date);
        if (input.day_portion) form.set('day_portion', input.day_portion);
        if (input.reason) form.set('reason', input.reason);
        form.set('file', file);
        return client
          .postForm<unknown>('/users/me/leave-requests', form)
          .then((res) => LeaveRequestSchema.parse(res));
      }
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

  /**
   * Fetch a single request via the top-level (approver-facing) route. The
   * server's `findByIdForViewer` authorizes the requester, the snapshotted
   * L1/L2 approver, or LEAVE:ViewAll/system_admin — so the chain approver in
   * the pending-approvals inbox can load full details for a row they see.
   * Distinct from `me.getOne` (own requests) and `admin.getOne` (HR).
   */
  getOne(id: number, client: ApiClient = apiClient()): Promise<LeaveRequest> {
    return client
      .get<unknown>(`/leave-requests/${id}`)
      .then((res) => LeaveRequestSchema.parse(res));
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

  /**
   * Download a request's attachment as a Blob (streamed + permission-checked
   * server-side). `original` for the source file; `preview` / `thumbnail` are
   * image-only renditions (404 for a PDF).
   */
  downloadAttachment(
    id: number,
    version: FileVersion = 'original',
    client: ApiClient = apiClient(),
  ): Promise<Blob> {
    return client.getBlob(`/leave-requests/${id}/attachment`, { params: { version } });
  },
};
