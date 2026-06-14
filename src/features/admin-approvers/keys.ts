import type { QueryKey } from '@tanstack/react-query';

/** Cache-key factory for the admin-approvers slice. The only place these keys are defined. */
export const adminApproverKeys = {
  all: ['admin-approvers'] as const,
  list: (page: number, search: string, unassignedOnly: boolean): QueryKey => [
    ...adminApproverKeys.all,
    'list',
    page,
    search,
    unassignedOnly,
  ],
  chain: (employeeId: number | undefined): QueryKey => [
    ...adminApproverKeys.all,
    'chain',
    employeeId,
  ],
};
