import { describe, expect, it } from 'vitest';
import { profileKeys } from '@/features/profile/keys';

describe('profileKeys', () => {
  it('all is the slice root', () => {
    expect(profileKeys.all).toEqual(['profile']);
  });

  it('me()', () => {
    expect(profileKeys.me()).toEqual(['profile', 'me']);
  });
});
