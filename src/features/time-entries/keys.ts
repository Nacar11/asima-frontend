import type { QueryKey } from '@tanstack/react-query';

/** Cache-key factory for the time-entries slice. The only place these keys are defined. */
export const timeEntryKeys = {
  all: ['time-entries'] as const,
  today: (): QueryKey => [...timeEntryKeys.all, 'today'],
  meList: (page: number): QueryKey => [...timeEntryKeys.all, 'me', page],
};
