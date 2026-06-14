import type { QueryKey } from '@tanstack/react-query';

/** Cache-key factory for the auth slice. The only place these keys are defined. */
export const authKeys = {
  all: ['auth'] as const,
  me: (): QueryKey => [...authKeys.all, 'me'],
  permissions: (): QueryKey => [...authKeys.all, 'me', 'permissions'],
};
