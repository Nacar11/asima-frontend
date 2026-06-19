import type { QueryKey } from '@tanstack/react-query';

/** Cache-key factory for the admin-schedule slice. The only place these keys are defined. */
export const adminScheduleKeys = {
  all: ['admin-schedule'] as const,
  none: (): QueryKey => [...adminScheduleKeys.all, 'none'],
  byEmployee: (employeeId: number): QueryKey => [...adminScheduleKeys.all, 'employee', employeeId],
  picker: (search: string): QueryKey => [...adminScheduleKeys.all, 'picker', search],
};
