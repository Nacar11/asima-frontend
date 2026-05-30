import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApprovalsPage } from '@/features/approvals/components/approvals-page';

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: { id: 1, system_admin: false },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const usePermissionsMock = vi.fn();
vi.mock('@/features/auth/use-permissions', () => ({
  usePermissions: () => usePermissionsMock(),
}));

const listPendingMock = vi.fn();
vi.mock('@/features/approvals/api', () => ({
  approvalsApi: { listPending: (...args: unknown[]) => listPendingMock(...args) },
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ApprovalsPage />
    </QueryClientProvider>,
  );
}

describe('ApprovalsPage', () => {
  beforeEach(() => {
    usePermissionsMock.mockReset();
    listPendingMock.mockReset();
  });

  it('shows the chain-filtered empty-state copy for an approver without override', async () => {
    usePermissionsMock.mockReturnValue({
      permissions: ['APPROVAL:View'],
      isLoading: false,
      isError: false,
    });
    listPendingMock.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      has_more: false,
    });
    renderPage();

    expect(
      screen.getByText('Requests where you are the current approver.'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('No pending approvals')).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/No requests need your approval right now/),
    ).toBeInTheDocument();
  });

  it('shows the override empty-state copy for HR (APPROVAL:ApproveAny)', async () => {
    usePermissionsMock.mockReturnValue({
      permissions: ['APPROVAL:View', 'APPROVAL:ApproveAny'],
      isLoading: false,
      isError: false,
    });
    listPendingMock.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      has_more: false,
    });
    renderPage();

    expect(
      screen.getByText('Every pending request across the organization.'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText(/no requests waiting for approval across the organization/i),
      ).toBeInTheDocument(),
    );
  });
});
