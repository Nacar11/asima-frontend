import { describe, expect, it } from 'vitest';
import { adminCompensationKeys } from '@/features/admin-compensation/keys';

describe('adminCompensationKeys', () => {
  it('all is the slice root', () => {
    expect(adminCompensationKeys.all).toEqual(['admin-compensation']);
  });

  it('byEmployee(id), picker(search), and none() build distinct keys', () => {
    expect(adminCompensationKeys.byEmployee(12)).toEqual(['admin-compensation', 'employee', 12]);
    expect(adminCompensationKeys.picker('ann')).toEqual(['admin-compensation', 'picker', 'ann']);
    expect(adminCompensationKeys.none()).toEqual(['admin-compensation', 'none']);
  });
});
