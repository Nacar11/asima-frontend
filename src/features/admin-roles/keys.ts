import type { QueryKey } from '@tanstack/react-query';

/** Cache-key factory for the admin-roles slice. The only place these keys are defined. */
export const adminRoleKeys = {
  all: ['admin-roles'] as const,
  list: (): QueryKey => [...adminRoleKeys.all, 'list'],
};
