import { describe, expect, it } from 'vitest';
import { approvalKeys } from '@/features/approvals/keys';

describe('approvalKeys', () => {
  it('all is the slice root', () => {
    expect(approvalKeys.all).toEqual(['approvals']);
  });

  it('pending(params)', () => {
    const params = { type: 'leave' as const, page: 1 };
    expect(approvalKeys.pending(params)).toEqual(['approvals', 'pending', params]);
  });
});
