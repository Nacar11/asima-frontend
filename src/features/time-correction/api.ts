import { ApiClient, apiClient } from '@/lib/api-client';
import {
  TimeCorrectionListSchema,
  TimeCorrectionSchema,
  type TcQuery,
  type TimeCorrectionList,
  type TimeCorrectionRequest,
  type UpdateCorrectionInput,
} from './schemas';

/** Clean wire payload for submit — times are already ISO strings here. */
export type SubmitCorrectionPayload = {
  target_entry_id?: number | null;
  work_date: string;
  proposed_time_in: string;
  proposed_time_out?: string | null;
  reason: string;
};

function toParams(query: TcQuery): Record<string, string | number | undefined> {
  const { status, ...rest } = query;
  return { ...rest, status: status && status.length > 0 ? status.join(',') : undefined };
}

/**
 * Time-correction client — same three-audience split as leave (me /
 * admin / approver). On final approval the backend rewrites the
 * underlying time_entries row with source='correction' (Q6); the
 * frontend only drives the request lifecycle.
 */
export const timeCorrectionApi = {
  me: {
    list(query: TcQuery = {}, client: ApiClient = apiClient()): Promise<TimeCorrectionList> {
      return client
        .get<unknown>('/users/me/time-correction-requests', { params: toParams(query) })
        .then((res) => TimeCorrectionListSchema.parse(res));
    },
    submit(
      payload: SubmitCorrectionPayload,
      client: ApiClient = apiClient(),
    ): Promise<TimeCorrectionRequest> {
      return client
        .post<unknown>('/users/me/time-correction-requests', payload)
        .then((res) => TimeCorrectionSchema.parse(res));
    },
    cancel(id: number, client: ApiClient = apiClient()): Promise<TimeCorrectionRequest> {
      return client
        .post<unknown>(`/users/me/time-correction-requests/${id}/cancel`)
        .then((res) => TimeCorrectionSchema.parse(res));
    },
  },

  admin: {
    list(query: TcQuery = {}, client: ApiClient = apiClient()): Promise<TimeCorrectionList> {
      return client
        .get<unknown>('/admin/time-correction-requests', { params: toParams(query) })
        .then((res) => TimeCorrectionListSchema.parse(res));
    },
    update(
      id: number,
      input: UpdateCorrectionInput,
      client: ApiClient = apiClient(),
    ): Promise<TimeCorrectionRequest> {
      return client
        .patch<unknown>(`/admin/time-correction-requests/${id}`, input)
        .then((res) => TimeCorrectionSchema.parse(res));
    },
    cancel(id: number, client: ApiClient = apiClient()): Promise<TimeCorrectionRequest> {
      return client
        .delete<unknown>(`/admin/time-correction-requests/${id}`)
        .then((res) => TimeCorrectionSchema.parse(res));
    },
  },

  approve(id: number, client: ApiClient = apiClient()): Promise<TimeCorrectionRequest> {
    return client
      .post<unknown>(`/time-correction-requests/${id}/approve`)
      .then((res) => TimeCorrectionSchema.parse(res));
  },

  reject(id: number, note: string, client: ApiClient = apiClient()): Promise<TimeCorrectionRequest> {
    return client
      .post<unknown>(`/time-correction-requests/${id}/reject`, { note })
      .then((res) => TimeCorrectionSchema.parse(res));
  },
};
