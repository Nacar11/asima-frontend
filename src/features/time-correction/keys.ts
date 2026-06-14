import type { QueryKey } from '@tanstack/react-query';

/** Cache-key factory for the time-correction slice. The only place these keys are defined. */
export const timeCorrectionKeys = {
  all: ['time-correction'] as const,
  meActive: (from: string | undefined, to: string | undefined): QueryKey => [
    ...timeCorrectionKeys.all,
    'me',
    'active',
    from,
    to,
  ],
  adminList: (p: {
    page: number;
    status?: string;
    employeeId?: number | string;
    from?: string;
    to?: string;
  }): QueryKey => [
    ...timeCorrectionKeys.all,
    'admin',
    'list',
    p.page,
    p.status,
    p.employeeId,
    p.from,
    p.to,
  ],
  request: (id: number | undefined): QueryKey => [...timeCorrectionKeys.all, 'request', id],
};
