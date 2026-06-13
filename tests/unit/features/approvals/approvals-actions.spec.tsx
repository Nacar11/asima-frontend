import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeaveApprovalsPage } from '@/features/approvals/components/leave-approvals-page';

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ user: { id: 5, system_admin: false } }),
}));
vi.mock('@/features/auth/use-permissions', () => ({
  usePermissions: () => ({ permissions: ['APPROVAL:View'], isLoading: false, isError: false }),
}));

const listPendingMock = vi.fn();
vi.mock('@/features/approvals/api', () => ({
  approvalsApi: { listPending: (...a: unknown[]) => listPendingMock(...a) },
}));

const approveMock = vi.fn();
const rejectMock = vi.fn();
vi.mock('@/features/leave/api', () => ({
  leaveApi: {
    approve: (...a: unknown[]) => approveMock(...a),
    reject: (...a: unknown[]) => rejectMock(...a),
    getOne: vi.fn(),
    downloadAttachment: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const LEAVE_ROW = {
  id: 42,
  kind: 'leave',
  employee_id: 12,
  employee_name: 'Ada Lovelace',
  requested_at: '2026-05-30T10:00:00.000Z',
  current_step: 1,
  current_approver_id: 5,
  summary: 'Annual leave, 2026-06-01 to 2026-06-05',
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LeaveApprovalsPage />
    </QueryClientProvider>,
  );
}

describe('LeaveApprovalsPage actions', () => {
  beforeEach(() => {
    listPendingMock.mockReset().mockResolvedValue({
      data: [LEAVE_ROW], total: 1, page: 1, limit: 20, has_more: false,
    });
    approveMock.mockReset().mockResolvedValue({});
    rejectMock.mockReset().mockResolvedValue({});
  });

  it('approves a leave row through the registry', async () => {
    renderPage();
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByRole('button', { name: /approve/i }));
    await waitFor(() => expect(approveMock).toHaveBeenCalledWith(42));
  });

  it('rejects a leave row with a required note', async () => {
    renderPage();
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByRole('button', { name: /^reject$/i }));
    const note = await screen.findByLabelText(/rejection note/i);
    await userEvent.type(note, 'No coverage');
    await userEvent.click(screen.getByRole('button', { name: /confirm reject/i }));
    await waitFor(() => expect(rejectMock).toHaveBeenCalledWith(42, 'No coverage'));
  });
});
