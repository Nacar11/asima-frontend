import type { QueryKey } from '@tanstack/react-query';

/** Cache-key factory for the admin-compensation slice. The only place these keys are defined. */
export const adminCompensationKeys = {
  all: ['admin-compensation'] as const,
  none: (): QueryKey => [...adminCompensationKeys.all, 'none'],
  byEmployee: (employeeId: number): QueryKey => [
    ...adminCompensationKeys.all,
    'employee',
    employeeId,
  ],
  picker: (search: string): QueryKey => [...adminCompensationKeys.all, 'picker', search],
};
