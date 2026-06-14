import { describe, expect, it } from 'vitest';
import { adminRoleKeys } from '@/features/admin-roles/keys';

describe('adminRoleKeys', () => {
  it('all is the slice root', () => {
    expect(adminRoleKeys.all).toEqual(['admin-roles']);
  });

  it('list()', () => {
    expect(adminRoleKeys.list()).toEqual(['admin-roles', 'list']);
  });
});
