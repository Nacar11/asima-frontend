import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TcDetailDrawer } from '@/features/time-correction/components/tc-detail-drawer';
import type { TimeCorrectionRequest } from '@/features/time-correction/schemas';

const approveMock = vi.fn();
const rejectMock = vi.fn();
const adminCancelMock = vi.fn();
vi.mock('@/features/time-correction/api', () => ({
  timeCorrectionApi: {
    approve: (...a: unknown[]) => approveMock(...a),
    reject: (...a: unknown[]) => rejectMock(...a),
    admin: {
      cancel: (...a: unknown[]) => adminCancelMock(...a),
      update: vi.fn(),
    },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const PENDING: TimeCorrectionRequest = {
  id: 7,
  employee_id: 12,
  target_entry_id: 88,
  work_date: '2026-06-10',
  proposed_time_in: '2026-06-10T09:00:00.000Z',
  proposed_time_out: '2026-06-10T18:00:00.000Z',
  reason: 'Forgot to clock in',
  status: 'pending_l1',
  submitted_at: '2026-06-10T19:00:00.000Z',
  decided_at: null,
  decided_by: null,
  decision_note: null,
  decision_path: null,
  cancelled_at: null,
  cancelled_by: null,
  l1_approver_id: 5,
  l2_approver_id: null,
  created_at: '2026-06-10T19:00:00.000Z',
  updated_at: '2026-06-10T19:00:00.000Z',
};

function renderDrawer(props: Partial<React.ComponentProps<typeof TcDetailDrawer>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TcDetailDrawer
        request={PENDING}
        employeeName="Ada Lovelace"
        open
        onClose={vi.fn()}
        canApproveAny
        canDelete
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe('TcDetailDrawer', () => {
  beforeEach(() => {
    approveMock.mockReset().mockResolvedValue(PENDING);
    rejectMock.mockReset().mockResolvedValue(PENDING);
    adminCancelMock.mockReset().mockResolvedValue(PENDING);
  });

  it('shows the request details', () => {
    renderDrawer();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Forgot to clock in')).toBeInTheDocument();
  });

  it('force-approves via the override path', async () => {
    renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: /approve/i }));
    await waitFor(() => expect(approveMock).toHaveBeenCalledWith(7));
  });

  it('rejects with a required note', async () => {
    renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: /^reject$/i }));
    await userEvent.type(screen.getByLabelText(/rejection note/i), 'Bad time');
    await userEvent.click(screen.getByRole('button', { name: /confirm reject/i }));
    await waitFor(() => expect(rejectMock).toHaveBeenCalledWith(7, 'Bad time'));
  });

  it('hides actions on a terminal request', () => {
    renderDrawer({ request: { ...PENDING, status: 'approved' } });
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
  });
});
