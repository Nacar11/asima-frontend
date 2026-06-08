import { describe, expect, it, vi } from 'vitest';
import { leaveApi } from '@/features/leave/api';
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
  id: 1,
  employee_id: 12,
  leave_type: 'vacation',
  start_date: '2026-06-01',
  end_date: '2026-06-05',
  working_days: 3,
  day_portion: 'full',
  start_time: null,
  end_time: null,
  reason: null,
  status: 'pending_l1',
  submitted_at: '2026-05-30T10:00:00.000Z',
  decided_at: null,
  decided_by: null,
  decision_note: null,
  decision_path: null,
  cancelled_at: null,
  cancelled_by: null,
  l1_approver_id: 5,
  l2_approver_id: null,
  created_at: '2026-05-30T10:00:00.000Z',
  updated_at: '2026-05-30T10:00:00.000Z',
};
const LIST = { data: [ROW], total: 1, page: 1, limit: 20, has_more: false };

describe('leaveApi', () => {
  it('me.list GETs the self-service endpoint', async () => {
    const c = stubClient(LIST);
    await leaveApi.me.list({ page: 1 }, c);
    expect(c.get).toHaveBeenCalledWith('/users/me/leave-requests', { params: { page: 1 } });
  });

  it('me.submit POSTs the self-service endpoint', async () => {
    const c = stubClient(ROW);
    await leaveApi.me.submit(
      {
        leave_type: 'vacation',
        start_date: '2026-06-01',
        end_date: '2026-06-05',
        day_portion: 'full',
      },
      c,
    );
    expect(c.post).toHaveBeenCalledWith('/users/me/leave-requests', {
      leave_type: 'vacation',
      start_date: '2026-06-01',
      end_date: '2026-06-05',
      day_portion: 'full',
    });
  });

  it('me.cancel POSTs the cancel sub-route', async () => {
    const c = stubClient(ROW);
    await leaveApi.me.cancel(1, c);
    expect(c.post).toHaveBeenCalledWith('/users/me/leave-requests/1/cancel');
  });

  it('admin.list serializes a status array to a comma string', async () => {
    const c = stubClient(LIST);
    await leaveApi.admin.list({ status: ['pending_l1', 'pending_l2'], page: 2 }, c);
    expect(c.get).toHaveBeenCalledWith('/admin/leave-requests', {
      params: { status: 'pending_l1,pending_l2', page: 2 },
    });
  });

  it('admin.cancel DELETEs the admin endpoint', async () => {
    const c = stubClient(ROW);
    await leaveApi.admin.cancel(1, c);
    expect(c.delete).toHaveBeenCalledWith('/admin/leave-requests/1');
  });

  it('approve POSTs the top-level approve route', async () => {
    const c = stubClient(ROW);
    await leaveApi.approve(1, c);
    expect(c.post).toHaveBeenCalledWith('/leave-requests/1/approve');
  });

  it('reject POSTs the note', async () => {
    const c = stubClient(ROW);
    await leaveApi.reject(1, 'no coverage', c);
    expect(c.post).toHaveBeenCalledWith('/leave-requests/1/reject', { note: 'no coverage' });
  });

  const BALANCES = [
    { leave_type: 'vacation', allowance: 10, used: 3, reserved: 2, available: 5 },
    { leave_type: 'sick', allowance: 10, used: 0, reserved: 0, available: 10 },
    { leave_type: 'bereavement', allowance: 0, used: 0, reserved: 0, available: 0 },
    { leave_type: 'birthday', allowance: 0, used: 0, reserved: 0, available: 0 },
    { leave_type: 'emergency', allowance: 0, used: 0, reserved: 0, available: 0 },
  ];

  it('me.balances GETs the balances endpoint and parses 5 rows', async () => {
    const c = stubClient(BALANCES);
    const res = await leaveApi.me.balances(c);
    expect(c.get).toHaveBeenCalledWith('/users/me/leave-balances');
    expect(res).toHaveLength(5);
  });

  it('me.dayCountPreview GETs day-count with date + portion params', async () => {
    const c = stubClient({ working_days: 0.5, start_time: '09:00:00', end_time: '14:00:00' });
    const res = await leaveApi.me.dayCountPreview(
      '2026-06-01',
      '2026-06-01',
      { day_portion: 'first_half', leave_type: 'vacation' },
      c,
    );
    expect(c.get).toHaveBeenCalledWith('/users/me/leave-requests/day-count', {
      params: {
        start_date: '2026-06-01',
        end_date: '2026-06-01',
        day_portion: 'first_half',
        leave_type: 'vacation',
      },
    });
    expect(res.working_days).toBe(0.5);
  });

  it('admin.grant POSTs the grant to the employee allocation endpoint', async () => {
    const c = stubClient({
      id: 1,
      employee_id: 12,
      leave_type: 'emergency',
      amount: 5,
      source: 'admin_grant',
      reason: null,
      granted_by: 7,
      created_at: '2026-05-31T00:00:00.000Z',
    });
    await leaveApi.admin.grant(12, { leave_type: 'emergency', amount: 5 }, c);
    expect(c.post).toHaveBeenCalledWith('/admin/users/12/leave-allocations', {
      leave_type: 'emergency',
      amount: 5,
    });
  });
});
