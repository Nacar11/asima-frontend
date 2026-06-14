import { describe, expect, it } from 'vitest';
import { adminUserKeys } from '@/features/admin-users/keys';

describe('adminUserKeys', () => {
  it('all is the slice root', () => {
    expect(adminUserKeys.all).toEqual(['admin-users']);
  });

  it('list() preserves page/search/roleId/isActive order', () => {
    expect(adminUserKeys.list({ page: 2, search: 'ann', roleId: 3, isActive: 'true' })).toEqual([
      'admin-users',
      'list',
      2,
      'ann',
      3,
      'true',
    ]);
  });

  it('approverCandidates()', () => {
    expect(adminUserKeys.approverCandidates()).toEqual(['admin-users', 'approver-candidates']);
  });

  it('filterOptions()', () => {
    expect(adminUserKeys.filterOptions()).toEqual(['admin-users', 'filter-options']);
  });
});
