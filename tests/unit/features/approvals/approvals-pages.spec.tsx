import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeaveApprovalsPage } from '@/features/approvals/components/leave-approvals-page';
import { TimeCorrectionApprovalsPage } from '@/features/approvals/components/time-correction-approvals-page';

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ status: 'authenticated', user: { id: 1, system_admin: false } }),
}));
vi.mock('@/features/auth/use-permissions', () => ({
  usePermissions: () => ({ permissions: ['APPROVAL:View'], isLoading: false, isError: false }),
}));

const listPendingMock = vi.fn();
vi.mock('@/features/approvals/api', () => ({
  approvalsApi: { listPending: (...args: unknown[]) => listPendingMock(...args) },
}));

function renderPage(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('approvals page wrappers', () => {
  beforeEach(() => {
    listPendingMock.mockReset().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      has_more: false,
    });
  });

  it('LeaveApprovalsPage titles itself and scopes the inbox to leave', async () => {
    renderPage(<LeaveApprovalsPage />);
    expect(screen.getByText('Pending Approvals (Leaves)')).toBeInTheDocument();
    await waitFor(() =>
      expect(listPendingMock).toHaveBeenCalledWith({ type: 'leave', page: 1, limit: 20 }),
    );
  });

  it('TimeCorrectionApprovalsPage titles itself and scopes the inbox to time corrections', async () => {
    renderPage(<TimeCorrectionApprovalsPage />);
    expect(screen.getByText('Pending Approvals (Time Corrections)')).toBeInTheDocument();
    await waitFor(() =>
      expect(listPendingMock).toHaveBeenCalledWith({
        type: 'time_correction',
        page: 1,
        limit: 20,
      }),
    );
  });
});
