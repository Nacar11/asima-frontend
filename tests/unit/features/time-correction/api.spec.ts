import { describe, expect, it, vi } from 'vitest';
import { timeCorrectionApi } from '@/features/time-correction/api';
import type { ApiClient } from '@/lib/api-client';

function stubClient(payload: unknown) {
  return {
    get: vi.fn().mockResolvedValue(payload),
    post: vi.fn().mockResolvedValue(payload),
    patch: vi.fn().mockResolvedValue(payload),
    delete: vi.fn().mockResolvedValue(payload),
  } as unknown as ApiClient & Record<string, ReturnType<typeof vi.fn>>;
}

const ROW = {
  id: 1, employee_id: 12, target_entry_id: 88, work_date: '2026-06-10',
  proposed_time_in: '2026-06-10T09:00:00.000Z', proposed_time_out: null,
  reason: 'x', status: 'pending_l1', submitted_at: '2026-06-10T19:00:00.000Z',
  decided_at: null, decided_by: null, decision_note: null, decision_path: null,
  cancelled_at: null, cancelled_by: null, l1_approver_id: 5, l2_approver_id: null,
  created_at: '2026-06-10T19:00:00.000Z', updated_at: '2026-06-10T19:00:00.000Z',
};
const LIST = { data: [ROW], total: 1, page: 1, limit: 20, has_more: false };

describe('timeCorrectionApi', () => {
  it('me.submit POSTs the self-service endpoint', async () => {
    const c = stubClient(ROW);
    await timeCorrectionApi.me.submit(
      { target_entry_id: 88, work_date: '2026-06-10', proposed_time_in: '2026-06-10T09:00:00.000Z', reason: 'x' },
      c,
    );
    expect(c.post).toHaveBeenCalledWith('/users/me/time-correction-requests', {
      target_entry_id: 88,
      work_date: '2026-06-10',
      proposed_time_in: '2026-06-10T09:00:00.000Z',
      reason: 'x',
    });
  });

  it('me.cancel POSTs the cancel sub-route', async () => {
    const c = stubClient(ROW);
    await timeCorrectionApi.me.cancel(1, c);
    expect(c.post).toHaveBeenCalledWith('/users/me/time-correction-requests/1/cancel');
  });

  it('admin.list serializes a status array', async () => {
    const c = stubClient(LIST);
    await timeCorrectionApi.admin.list({ status: ['pending_l1'], page: 1 }, c);
    expect(c.get).toHaveBeenCalledWith('/admin/time-correction-requests', {
      params: { status: 'pending_l1', page: 1 },
    });
  });

  it('approve POSTs the top-level route', async () => {
    const c = stubClient(ROW);
    await timeCorrectionApi.approve(1, c);
    expect(c.post).toHaveBeenCalledWith('/time-correction-requests/1/approve');
  });

  it('reject POSTs the note', async () => {
    const c = stubClient(ROW);
    await timeCorrectionApi.reject(1, 'bad time', c);
    expect(c.post).toHaveBeenCalledWith('/time-correction-requests/1/reject', { note: 'bad time' });
  });
});
