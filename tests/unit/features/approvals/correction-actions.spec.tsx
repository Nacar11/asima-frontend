import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimeCorrectionApprovalsPage } from '@/features/approvals/components/time-correction-approvals-page';

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

const tcApproveMock = vi.fn();
vi.mock('@/features/time-correction/api', () => ({
  timeCorrectionApi: {
    approve: (...a: unknown[]) => tcApproveMock(...a),
    reject: vi.fn(),
    getOne: vi.fn(),
  },
}));
vi.mock('@/features/leave/api', () => ({
  leaveApi: { approve: vi.fn(), reject: vi.fn(), getOne: vi.fn(), downloadAttachment: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TC_ROW = {
  id: 7,
  kind: 'time_correction',
  employee_id: 12,
  employee_name: 'Ada Lovelace',
  requested_at: '2026-06-10T19:00:00.000Z',
  current_step: 1,
  current_approver_id: 5,
  summary: 'Time correction, 2026-06-10',
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TimeCorrectionApprovalsPage />
    </QueryClientProvider>,
  );
}

describe('TimeCorrectionApprovalsPage — time-correction actions', () => {
  beforeEach(() => {
    listPendingMock.mockReset().mockResolvedValue({
      data: [TC_ROW], total: 1, page: 1, limit: 20, has_more: false,
    });
    tcApproveMock.mockReset().mockResolvedValue({});
  });

  it('approves a time-correction row through the registry', async () => {
    renderPage();
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByRole('button', { name: /approve/i }));
    await waitFor(() => expect(tcApproveMock).toHaveBeenCalledWith(7));
  });
});
