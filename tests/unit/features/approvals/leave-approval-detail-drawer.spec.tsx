import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeaveApprovalDetailDrawer } from '@/features/approvals/components/leave-approval-detail-drawer';
import type { PendingApproval } from '@/features/approvals/schemas';
import type { LeaveRequest } from '@/features/leave/schemas';

const getOneMock = vi.fn();
const downloadMock = vi.fn();
vi.mock('@/features/leave/api', () => ({
  leaveApi: {
    getOne: (...a: unknown[]) => getOneMock(...a),
    downloadAttachment: (...a: unknown[]) => downloadMock(...a),
  },
}));

const ROW: PendingApproval = {
  id: 9,
  kind: 'leave',
  employee_id: 12,
  employee_name: 'Jackson Castro',
  requested_at: '2026-06-13T08:00:00.000Z',
  current_step: 1,
  current_approver_id: 5,
  summary: 'sick leave, 2026-06-15 to 2026-06-15',
};

const REQUEST: LeaveRequest = {
  id: 9,
  employee_id: 12,
  leave_type: 'sick',
  start_date: '2026-06-15',
  end_date: '2026-06-15',
  working_days: 1,
  day_portion: 'full',
  start_time: null,
  end_time: null,
  reason: 'Flu',
  status: 'pending_l1',
  submitted_at: '2026-06-13T08:00:00.000Z',
  decided_at: null,
  decided_by: null,
  decision_note: null,
  decision_path: null,
  cancelled_at: null,
  cancelled_by: null,
  l1_approver_id: 5,
  l2_approver_id: null,
  attachment_id: null,
  created_at: '2026-06-13T08:00:00.000Z',
  updated_at: '2026-06-13T08:00:00.000Z',
};

function renderDrawer(
  props: Partial<React.ComponentProps<typeof LeaveApprovalDetailDrawer>> = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LeaveApprovalDetailDrawer
        row={ROW}
        open
        onClose={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe('LeaveApprovalDetailDrawer', () => {
  beforeEach(() => {
    getOneMock.mockReset().mockResolvedValue(REQUEST);
    downloadMock.mockReset().mockResolvedValue(new Blob(['x']));
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('fetches the full request by the row id and shows its details', async () => {
    renderDrawer();
    await waitFor(() => expect(getOneMock).toHaveBeenCalledWith(9));
    expect(screen.getByText('Jackson Castro')).toBeInTheDocument();
    expect(await screen.findByText('Sick')).toBeInTheDocument();
    expect(screen.getByText('Flu')).toBeInTheDocument();
  });

  it('renders the attachment section only when the request has one', async () => {
    getOneMock.mockResolvedValue({ ...REQUEST, attachment_id: 44 });
    renderDrawer();
    expect(await screen.findByText('Attachment')).toBeInTheDocument();
  });

  it('approves a pending request through the inbox callback', async () => {
    const onApprove = vi.fn();
    renderDrawer({ onApprove });
    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledWith(ROW);
  });

  it('triggers the reject flow through the inbox callback', async () => {
    const onReject = vi.fn();
    renderDrawer({ onReject });
    await userEvent.click(await screen.findByRole('button', { name: 'Reject' }));
    expect(onReject).toHaveBeenCalledWith(ROW);
  });

  it('hides Approve / Reject on a terminal request', async () => {
    getOneMock.mockResolvedValue({ ...REQUEST, status: 'approved' });
    renderDrawer();
    expect(await screen.findByText('Flu')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reject' })).toBeNull();
  });
});
