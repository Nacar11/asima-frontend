import type { QueryKey } from '@tanstack/react-query';

/** Cache-key factory for the schedule slice. The only place these keys are defined. */
export const scheduleKeys = {
  all: ['schedule'] as const,
  me: (): QueryKey => [...scheduleKeys.all, 'me'],
};
