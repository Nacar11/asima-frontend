import { describe, expect, it } from 'vitest';
import { adminApproverKeys } from '@/features/admin-approvers/keys';

describe('adminApproverKeys', () => {
  it('all is the slice root', () => {
    expect(adminApproverKeys.all).toEqual(['admin-approvers']);
  });

  it('list() preserves page/search/unassignedOnly order', () => {
    expect(adminApproverKeys.list(2, 'ann', true)).toEqual([
      'admin-approvers',
      'list',
      2,
      'ann',
      true,
    ]);
  });

  it('chain(id)', () => {
    expect(adminApproverKeys.chain(7)).toEqual(['admin-approvers', 'chain', 7]);
  });
});
