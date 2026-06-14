import type { QueryKey } from '@tanstack/react-query';

/** Cache-key factory for the profile slice. The only place these keys are defined. */
export const profileKeys = {
  all: ['profile'] as const,
  me: (): QueryKey => [...profileKeys.all, 'me'],
};
