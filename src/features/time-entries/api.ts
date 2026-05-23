import { ApiClient, apiClient } from '@/lib/api-client';
import {
  TimeEntrySchema,
  TimeEntryListSchema,
  type TimeEntry,
  type TimeEntryList,
  type ListMyTimeEntriesParams,
} from './schemas';

export const timeEntriesApi = {
  punch(client: ApiClient = apiClient()): Promise<TimeEntry> {
    return client
      .post<unknown>('/users/me/time-entries/punch')
      .then((res) => TimeEntrySchema.parse(res));
  },

  listMine(
    params: ListMyTimeEntriesParams = {},
    client: ApiClient = apiClient(),
  ): Promise<TimeEntryList> {
    return client
      .get<unknown>('/users/me/time-entries', { params })
      .then((res) => TimeEntryListSchema.parse(res));
  },

  today(client: ApiClient = apiClient()): Promise<TimeEntryList> {
    return client
      .get<unknown>('/users/me/time-entries/today')
      .then((res) => TimeEntryListSchema.parse(res));
  },
};
