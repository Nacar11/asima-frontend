import { describe, expect, it, vi } from 'vitest';
import { adminApproversApi } from '@/features/admin-approvers/api';
import type { ApiClient } from '@/lib/api-client';

/** Minimal ApiClient stub — only the verbs the api module uses. */
function stubClient(impl: Partial<Record<'get' | 'post' | 'patch', unknown>>) {
  return {
    get: vi.fn().mockResolvedValue(impl.get),
    post: vi.fn().mockResolvedValue(impl.post),
    patch: vi.fn().mockResolvedValue(impl.patch),
  } as unknown as ApiClient & {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };
}

const listPayload = {
  data: [
    {
      employee_id: 12,
      employee_name: 'Ada Lovelace',
      employee_email: 'ada@asima.test',
      l1_approver_id: 5,
      l1_approver_name: 'Grace Hopper',
      l2_approver_id: null,
      l2_approver_name: null,
      updated_at: '2026-05-30T10:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  has_more: false,
};

describe('adminApproversApi', () => {
  it('list() GETs /admin/approvers with params and parses the envelope', async () => {
    const client = stubClient({ get: listPayload });
    const res = await adminApproversApi.list({ page: 1, search: 'ada' }, client);
    expect(client.get).toHaveBeenCalledWith('/admin/approvers', {
      params: { page: 1, search: 'ada' },
    });
    expect(res.data[0]?.employee_name).toBe('Ada Lovelace');
  });

  it('setChain() PATCHes the employee endpoint and parses the active chain', async () => {
    const client = stubClient({ patch: { l1_approver_id: 5, l2_approver_id: 7 } });
    const res = await adminApproversApi.setChain(12, { l1_approver_id: 5, l2_approver_id: 7 }, client);
    expect(client.patch).toHaveBeenCalledWith('/admin/approvers/12', {
      l1_approver_id: 5,
      l2_approver_id: 7,
    });
    expect(res.l2_approver_id).toBe(7);
  });

  it('getOne() GETs the employee endpoint and parses rows', async () => {
    const client = stubClient({
      get: { employee_id: 12, l1: null, l2: null },
    });
    const res = await adminApproversApi.getOne(12, client);
    expect(client.get).toHaveBeenCalledWith('/admin/approvers/12');
    expect(res.l1).toBeNull();
  });

  it('bulkReassign() POSTs and parses the result', async () => {
    const client = stubClient({ post: { reassigned: 3, skipped: [] } });
    const res = await adminApproversApi.bulkReassign(
      { from_approver_id: 5, to_approver_id: 8 },
      client,
    );
    expect(client.post).toHaveBeenCalledWith('/admin/approvers/bulk-reassign', {
      from_approver_id: 5,
      to_approver_id: 8,
    });
    expect(res.reassigned).toBe(3);
  });
});
