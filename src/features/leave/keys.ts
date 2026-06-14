import type { QueryKey } from '@tanstack/react-query';

/**
 * Cache-key factory for the leave slice. The only place these keys are defined.
 * `adminBalances`/`adminAllocations` keep their existing `'admin'`-rooted value
 * (preserved exactly) — the grant flow seeded those keys before this factory.
 */
export const leaveKeys = {
  all: ['leave'] as const,
  me: (): QueryKey => [...leaveKeys.all, 'me'],
  meList: (page: number): QueryKey => [...leaveKeys.all, 'me', 'list', page],
  balances: (): QueryKey => [...leaveKeys.all, 'balances'],
  request: (id: number | undefined): QueryKey => [...leaveKeys.all, 'request', id],
  adminList: (p: {
    page: number;
    status?: string;
    employeeId?: number | string;
    from?: string;
    to?: string;
  }): QueryKey => [...leaveKeys.all, 'admin', 'list', p.page, p.status, p.employeeId, p.from, p.to],
  dayCount: (start: string, end: string, portion: string, leaveType: string): QueryKey => [
    ...leaveKeys.all,
    'day-count',
    start,
    end,
    portion,
    leaveType,
  ],
  attachmentThumb: (requestId: number): QueryKey => [
    ...leaveKeys.all,
    'attachment',
    requestId,
    'thumbnail',
  ],
  adminBalances: (employeeId: number | string): QueryKey => ['admin', 'leave-balances', employeeId],
  adminAllocations: (employeeId: number | string): QueryKey => [
    'admin',
    'leave-allocations',
    employeeId,
  ],
};
