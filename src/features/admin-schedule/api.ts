import { ApiClient, apiClient } from '@/lib/api-client';
import type { WorkSchedule } from '@/features/schedule/schemas';
import {
  AdminScheduleListSchema,
  ScheduleChangeImpactSchema,
  ScheduleChangeResultSchema,
  type PreviewedCancel,
  type ScheduleChangeImpact,
  type ScheduleChangeIntent,
  type ScheduleChangeResult,
} from './schemas';

/**
 * Admin schedule management + cascade-aware change flow. Gated server-side by
 * SCHEDULE:{View,Update,Delete}; the page also wraps in <RequirePermission> for
 * friendly UX. The client trusts the server to enforce.
 */
export const adminScheduleApi = {
  /** Active weekly rows for one employee (effective_to IS NULL), one per weekday. */
  activeForEmployee(employeeId: number, client: ApiClient = apiClient()): Promise<WorkSchedule[]> {
    return client
      .get<unknown>('/admin/work-schedules', { params: { employee_id: employeeId, limit: 100 } })
      .then((res) => AdminScheduleListSchema.parse(res))
      .then((list) => list.data.filter((r) => r.effective_to === null && r.deleted_at === null));
  },

  preview(
    intent: ScheduleChangeIntent,
    client: ApiClient = apiClient(),
  ): Promise<ScheduleChangeImpact> {
    return client
      .post<unknown>('/admin/work-schedules/changes/preview', intent)
      .then((res) => ScheduleChangeImpactSchema.parse(res));
  },

  apply(
    intent: ScheduleChangeIntent,
    previewed: PreviewedCancel[],
    client: ApiClient = apiClient(),
  ): Promise<ScheduleChangeResult> {
    return client
      .post<unknown>('/admin/work-schedules/changes', { ...intent, previewed })
      .then((res) => ScheduleChangeResultSchema.parse(res));
  },
};
