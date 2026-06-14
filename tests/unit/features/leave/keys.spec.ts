import { describe, expect, it } from 'vitest';
import { leaveKeys } from '@/features/leave/keys';

describe('leaveKeys', () => {
  it('all is the slice root', () => {
    expect(leaveKeys.all).toEqual(['leave']);
  });

  it('me() / meList() / balances()', () => {
    expect(leaveKeys.me()).toEqual(['leave', 'me']);
    expect(leaveKeys.meList(3)).toEqual(['leave', 'me', 'list', 3]);
    expect(leaveKeys.balances()).toEqual(['leave', 'balances']);
  });

  it('request(id)', () => {
    expect(leaveKeys.request(5)).toEqual(['leave', 'request', 5]);
  });

  it('adminList() preserves page/status/employeeId/from/to order', () => {
    expect(
      leaveKeys.adminList({ page: 1, status: 'approved', employeeId: 2, from: 'a', to: 'b' }),
    ).toEqual(['leave', 'admin', 'list', 1, 'approved', 2, 'a', 'b']);
  });

  it('dayCount() / attachmentThumb()', () => {
    expect(leaveKeys.dayCount('s', 'e', 'first_half', 'vacation')).toEqual([
      'leave',
      'day-count',
      's',
      'e',
      'first_half',
      'vacation',
    ]);
    expect(leaveKeys.attachmentThumb(8)).toEqual(['leave', 'attachment', 8, 'thumbnail']);
  });

  it('admin grant keys keep their existing "admin"-rooted value', () => {
    expect(leaveKeys.adminBalances(4)).toEqual(['admin', 'leave-balances', 4]);
    expect(leaveKeys.adminAllocations(4)).toEqual(['admin', 'leave-allocations', 4]);
  });
});
