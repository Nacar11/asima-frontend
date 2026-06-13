import { describe, expect, it, vi } from 'vitest';
import { approvalsApi } from '@/features/approvals/api';
import type { ApiClient } from '@/lib/api-client';

function stubClient(payload: unknown) {
  return {
    get: vi.fn().mockResolvedValue(payload),
  } as unknown as ApiClient & Record<string, ReturnType<typeof vi.fn>>;
}

const EMPTY = { data: [], total: 0, page: 1, limit: 20, has_more: false };

describe('approvalsApi.listPending', () => {
  it('GETs the pending inbox with no params by default', async () => {
    const c = stubClient(EMPTY);
    await approvalsApi.listPending({}, c);
    expect(c.get).toHaveBeenCalledWith('/approvals/pending', { params: {} });
  });

  it('forwards the kind type filter so a page can scope to one resource', async () => {
    const c = stubClient(EMPTY);
    await approvalsApi.listPending({ type: 'leave', page: 2, limit: 20 }, c);
    expect(c.get).toHaveBeenCalledWith('/approvals/pending', {
      params: { type: 'leave', page: 2, limit: 20 },
    });
  });
});
