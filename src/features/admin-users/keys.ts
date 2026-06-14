import type { QueryKey } from '@tanstack/react-query';

type UserListParams = {
  page: number;
  search: string;
  roleId?: number | string;
  isActive?: boolean | string;
};

/** Cache-key factory for the admin-users slice. The only place these keys are defined. */
export const adminUserKeys = {
  all: ['admin-users'] as const,
  list: (p: UserListParams): QueryKey => [
    ...adminUserKeys.all,
    'list',
    p.page,
    p.search,
    p.roleId,
    p.isActive,
  ],
  approverCandidates: (): QueryKey => [...adminUserKeys.all, 'approver-candidates'],
  filterOptions: (): QueryKey => [...adminUserKeys.all, 'filter-options'],
};
