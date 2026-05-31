import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminTimeCorrectionsPage } from '@/features/time-correction/components/admin-tc-page';

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ user: { id: 1, system_admin: false } }),
}));
vi.mock('@/features/auth/use-permissions', () => ({
  usePermissions: () => ({
    permissions: ['TIME_CORRECTION:ViewAll', 'TIME_CORRECTION:ApproveAny'],
    isLoading: false,
  }),
}));

const adminListMock = vi.fn();
vi.mock('@/features/time-correction/api', () => ({
  timeCorrectionApi: { admin: { list: (...a: unknown[]) => adminListMock(...a) } },
}));
const usersListMock = vi.fn();
vi.mock('@/features/admin-users/api', () => ({
  adminUsersApi: { list: (...a: unknown[]) => usersListMock(...a) },
}));

const ROW = {
  id: 7, employee_id: 12, target_entry_id: 88, work_date: '2026-06-10',
  proposed_time_in: '2026-06-10T09:00:00.000Z', proposed_time_out: '2026-06-10T18:00:00.000Z',
  reason: 'x', status: 'pending_l1', submitted_at: '2026-06-10T19:00:00.000Z',
  decided_at: null, decided_by: null, decision_note: null, decision_path: null,
  cancelled_at: null, cancelled_by: null, l1_approver_id: 5, l2_approver_id: null,
  created_at: '2026-06-10T19:00:00.000Z', updated_at: '2026-06-10T19:00:00.000Z',
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AdminTimeCorrectionsPage />
    </QueryClientProvider>,
  );
}

describe('AdminTimeCorrectionsPage', () => {
  beforeEach(() => {
    adminListMock.mockReset().mockResolvedValue({
      data: [ROW], total: 1, page: 1, limit: 20, has_more: false,
    });
    usersListMock.mockReset().mockResolvedValue({
      data: [{ id: 12, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@asima.test',
        title: null, role_id: 1, role: { id: 1, name: 'EMPLOYEE' }, system_admin: false,
        is_active: true, last_login_at: null, created_at: '', updated_at: '', deleted_at: null }],
      total: 1, page: 1, limit: 100, has_more: false,
    });
  });

  it('renders rows with the mapped employee name', async () => {
    renderPage();
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('passes a status filter to the list query', async () => {
    renderPage();
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByRole('button', { name: /filter by status/i }));
    const listbox = await screen.findByRole('listbox', { name: /filter by status/i });
    await userEvent.click(within(listbox).getByText('Approved'));
    await waitFor(() =>
      expect(adminListMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: ['approved'] }),
      ),
    );
  });

  it('shows an empty state when there are no requests', async () => {
    adminListMock.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, has_more: false });
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /no time-correction requests/i }),
    ).toBeInTheDocument();
  });

  it('opens the detail drawer when a row is clicked', async () => {
    renderPage();
    await userEvent.click(await screen.findByText('Ada Lovelace'));
    expect(await screen.findByText(/correction #7/i)).toBeInTheDocument();
  });
});
