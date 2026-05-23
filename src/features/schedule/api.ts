import { ApiClient, apiClient } from '@/lib/api-client';
import { MyScheduleSchema, type WorkSchedule } from './schemas';

export const scheduleApi = {
  mySchedule(client: ApiClient = apiClient()): Promise<WorkSchedule[]> {
    return client
      .get<unknown>('/users/me/work-schedule')
      .then((res) => MyScheduleSchema.parse(res));
  },
};
