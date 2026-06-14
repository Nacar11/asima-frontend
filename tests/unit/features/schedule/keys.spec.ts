import { describe, expect, it } from 'vitest';
import { scheduleKeys } from '@/features/schedule/keys';

describe('scheduleKeys', () => {
  it('all is the slice root', () => {
    expect(scheduleKeys.all).toEqual(['schedule']);
  });

  it('me()', () => {
    expect(scheduleKeys.me()).toEqual(['schedule', 'me']);
  });
});
