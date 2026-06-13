import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimeCorrectionApprovalDetailDrawer } from '@/features/approvals/components/time-correction-approval-detail-drawer';
import type { PendingApproval } from '@/features/approvals/schemas';
import type { TimeCorrectionRequest } from '@/features/time-correction/schemas';

const getOneMock = vi.fn();
vi.mock('@/features/time-correction/api', () => ({
  timeCorrectionApi: {
    getOne: (...a: unknown[]) => getOneMock(...a),
  },
}));

const ROW: PendingApproval = {
  id: 14,
  kind: 'time_correction',
  employee_id: 12,
  employee_name: 'Jackson Castro',
  requested_at: '2026-06-13T08:00:00.000Z',
  current_step: 1,
  current_approver_id: 5,
  summary: 'correction for 2026-06-10',
  time_correction: {
    original_time_in: '2026-06-10T02:00:00.000Z',
    original_time_out: null,
    proposed_time_in: '2026-06-10T01:00:00.000Z',
    proposed_time_out: null,
    is_new_log: false,
  },
};

const REQUEST: TimeCorrectionRequest = {
  id: 14,
  employee_id: 12,
  target_entry_id: 88,
  original_time_in: '2026-06-10T02:00:00.000Z',
  original_time_out: null,
  work_date: '2026-06-10',
  proposed_time_in: '2026-06-10T01:00:00.000Z',
  proposed_time_out: null,
  reason: 'Forgot to punch in',
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
  created_at: '2026-06-13T08:00:00.000Z',
  updated_at: '2026-06-13T08:00:00.000Z',
};

function renderDrawer(
  props: Partial<React.ComponentProps<typeof TimeCorrectionApprovalDetailDrawer>> = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TimeCorrectionApprovalDetailDrawer
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

describe('TimeCorrectionApprovalDetailDrawer', () => {
  beforeEach(() => {
    getOneMock.mockReset().mockResolvedValue(REQUEST);
  });

  it('fetches the full correction by the row id and shows its details', async () => {
    renderDrawer();
    await waitFor(() => expect(getOneMock).toHaveBeenCalledWith(14));
    expect(screen.getByText('Jackson Castro')).toBeInTheDocument();
    expect(await screen.findByText('Forgot to punch in')).toBeInTheDocument();
    expect(screen.getByText('2026-06-10')).toBeInTheDocument();
  });

  it('titles a request that targets an entry "Update Time Log"', async () => {
    renderDrawer();
    expect(await screen.findByText('Update Time Log')).toBeInTheDocument();
  });

  it('titles a null-target request "Add Time Log"', async () => {
    getOneMock.mockResolvedValue({ ...REQUEST, target_entry_id: null });
    renderDrawer({
      row: { ...ROW, time_correction: { ...ROW.time_correction!, is_new_log: true } },
    });
    expect(await screen.findByText('Add Time Log')).toBeInTheDocument();
  });

  it('does not show a Target Entry field', async () => {
    renderDrawer();
    await screen.findByText('Forgot to punch in');
    expect(screen.queryByText(/target entry/i)).toBeNull();
  });

  it('renders Proposed In as an original→proposed diff', async () => {
    renderDrawer();
    const label = await screen.findByText('Proposed In:');
    // The value sits in the sibling span; both original and proposed render
    // with an arrow between them.
    expect(label.parentElement?.textContent).toMatch(/→/);
  });

  it('approves a pending correction through the inbox callback', async () => {
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

  it('hides Approve / Reject on a terminal correction', async () => {
    getOneMock.mockResolvedValue({ ...REQUEST, status: 'rejected' });
    renderDrawer();
    expect(await screen.findByText('Forgot to punch in')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reject' })).toBeNull();
  });
});
