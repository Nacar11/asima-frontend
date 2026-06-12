import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApproversPage } from '@/features/admin-approvers/components/approvers-page';

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ user: { id: 1, system_admin: false } }),
}));

const usePermissionsMock = vi.fn();
vi.mock('@/features/auth/use-permissions', () => ({
  usePermissions: () => usePermissionsMock(),
}));

const listMock = vi.fn();
const allMatchingIdsMock = vi.fn();
const bulkAssignMock = vi.fn();
vi.mock('@/features/admin-approvers/api', () => ({
  adminApproversApi: {
    list: (...a: unknown[]) => listMock(...a),
    allMatchingIds: (...a: unknown[]) => allMatchingIdsMock(...a),
    bulkAssign: (...a: unknown[]) => bulkAssignMock(...a),
  },
}));

const listUsersMock = vi.fn();
vi.mock('@/features/admin-users/api', () => ({
  adminUsersApi: { list: (...a: unknown[]) => listUsersMock(...a) },
}));

import userEvent from '@testing-library/user-event';

const ROW = {
  employee_id: 12,
  employee_name: 'Ada Lovelace',
  employee_email: 'ada@asima.test',
  l1_approver_id: 5,
  l1_approver_name: 'Grace Hopper',
  l2_approver_id: null,
  l2_approver_name: null,
  updated_at: '2026-05-30T10:00:00.000Z',
};

const UNASSIGNED_ROW = {
  employee_id: 20,
  employee_name: 'Nora Unset',
  employee_email: 'nora@asima.test',
  l1_approver_id: null,
  l1_approver_name: null,
  l2_approver_id: null,
  l2_approver_name: null,
  updated_at: null,
};

const withUpdate = () =>
  usePermissionsMock.mockReturnValue({
    permissions: ['APPROVAL_CHAIN:View', 'APPROVAL_CHAIN:Update'],
    isLoading: false,
  });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ApproversPage />
    </QueryClientProvider>,
  );
}

describe('ApproversPage', () => {
  beforeEach(() => {
    usePermissionsMock.mockReset();
    listMock.mockReset();
    listUsersMock.mockReset().mockResolvedValue({
      data: [], total: 0, page: 1, limit: 100, has_more: false,
    });
  });

  it('renders employee rows with their approver names', async () => {
    usePermissionsMock.mockReturnValue({ permissions: ['APPROVAL_CHAIN:View'], isLoading: false });
    listMock.mockResolvedValue({ data: [ROW], total: 1, page: 1, limit: 20, has_more: false });
    renderPage();
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('shows an empty state when there are no employees', async () => {
    usePermissionsMock.mockReturnValue({ permissions: ['APPROVAL_CHAIN:View'], isLoading: false });
    listMock.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, has_more: false });
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /no employees yet/i }),
    ).toBeInTheDocument();
  });

  it('hides the bulk-reassign button without APPROVAL_CHAIN:Update', async () => {
    usePermissionsMock.mockReturnValue({ permissions: ['APPROVAL_CHAIN:View'], isLoading: false });
    listMock.mockResolvedValue({ data: [ROW], total: 1, page: 1, limit: 20, has_more: false });
    renderPage();
    await screen.findByText('Ada Lovelace');
    expect(screen.queryByRole('button', { name: /bulk reassign/i })).not.toBeInTheDocument();
  });

  it('shows the bulk-reassign button with APPROVAL_CHAIN:Update', async () => {
    usePermissionsMock.mockReturnValue({
      permissions: ['APPROVAL_CHAIN:View', 'APPROVAL_CHAIN:Update'],
      isLoading: false,
    });
    listMock.mockResolvedValue({ data: [ROW], total: 1, page: 1, limit: 20, has_more: false });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /bulk reassign/i })).toBeInTheDocument(),
    );
  });

  it('toggling "Only unassigned" passes the filter to the list query', async () => {
    withUpdate();
    listMock.mockResolvedValue({
      data: [UNASSIGNED_ROW], total: 1, page: 1, limit: 20, has_more: false,
    });
    renderPage();
    await screen.findByText('Nora Unset');
    await userEvent.click(screen.getByRole('button', { name: /only unassigned/i }));
    await waitFor(() =>
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({ unassigned: true }),
      ),
    );
  });

  it('selecting a row reveals the action bar and opens the assign dialog', async () => {
    withUpdate();
    listMock.mockResolvedValue({
      data: [UNASSIGNED_ROW], total: 1, page: 1, limit: 20, has_more: false,
    });
    renderPage();
    await screen.findByText('Nora Unset');
    await userEvent.click(screen.getByRole('checkbox', { name: /select nora unset/i }));
    expect(await screen.findByText(/1 selected/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /assign approver/i }));
    expect(
      await screen.findByRole('heading', { name: /bulk assign approver/i }),
    ).toBeInTheDocument();
  });
});
