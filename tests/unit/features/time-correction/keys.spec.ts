import { describe, expect, it } from 'vitest';
import { timeCorrectionKeys } from '@/features/time-correction/keys';

describe('timeCorrectionKeys', () => {
  it('all is the slice root', () => {
    expect(timeCorrectionKeys.all).toEqual(['time-correction']);
  });

  it('meActive(from, to)', () => {
    expect(timeCorrectionKeys.meActive('2026-06-01', '2026-06-30')).toEqual([
      'time-correction',
      'me',
      'active',
      '2026-06-01',
      '2026-06-30',
    ]);
  });

  it('adminList() preserves page/status/employeeId/from/to order', () => {
    expect(
      timeCorrectionKeys.adminList({
        page: 1,
        status: 'pending',
        employeeId: 4,
        from: '2026-06-01',
        to: '2026-06-30',
      }),
    ).toEqual(['time-correction', 'admin', 'list', 1, 'pending', 4, '2026-06-01', '2026-06-30']);
  });

  it('request(id)', () => {
    expect(timeCorrectionKeys.request(9)).toEqual(['time-correction', 'request', 9]);
  });
});
