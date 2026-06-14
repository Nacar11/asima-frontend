import { describe, expect, it } from 'vitest';
import { authKeys } from '@/features/auth/keys';

describe('authKeys', () => {
  it('all is the slice root', () => {
    expect(authKeys.all).toEqual(['auth']);
  });

  it('permissions() preserves the original PERMISSIONS_QUERY_KEY value', () => {
    expect(authKeys.permissions()).toEqual(['auth', 'me', 'permissions']);
  });
});
