import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditUserDrawer } from '@/features/admin-users/components/edit-user-drawer';
import type { AdminUser } from '@/features/admin-users/schemas';

const updateMock = vi.fn();
const listUsersMock = vi.fn();
vi.mock('@/features/admin-users/api', () => ({
  adminUsersApi: {
    update: (...a: unknown[]) => updateMock(...a),
    list: (...a: unknown[]) => listUsersMock(...a),
  },
}));

const listRolesMock = vi.fn();
vi.mock('@/features/admin-roles/api', () => ({
  adminRolesApi: { list: (...a: unknown[]) => listRolesMock(...a) },
}));

const getChainMock = vi.fn();
const setChainMock = vi.fn();
vi.mock('@/features/admin-approvers/api', () => ({
  adminApproversApi: {
    getOne: (...a: unknown[]) => getChainMock(...a),
    setChain: (...a: unknown[]) => setChainMock(...a),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const EMPLOYEE: AdminUser = {
  id: 12,
  email: 'ada@asima.test',
  first_name: 'Ada',
  last_name: 'Lovelace',
  title: null,
  role_id: 1,
  role: { id: 1, name: 'EMPLOYEE' },
  system_admin: false,
  is_active: true,
  last_login_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  deleted_at: null,
};

const CANDIDATES = {
  data: [
    { ...EMPLOYEE },
    { ...EMPLOYEE, id: 5, first_name: 'Grace', last_name: 'Hopper', email: 'grace@asima.test' },
    { ...EMPLOYEE, id: 7, first_name: 'Alan', last_name: 'Turing', email: 'alan@asima.test' },
  ],
  total: 3,
  page: 1,
  limit: 100,
  has_more: false,
};

function renderDrawer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <EditUserDrawer user={EMPLOYEE} open onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('EditUserDrawer — approver chain', () => {
  beforeEach(() => {
    updateMock.mockReset().mockResolvedValue(EMPLOYEE);
    listUsersMock.mockReset().mockResolvedValue(CANDIDATES);
    listRolesMock.mockReset().mockResolvedValue({
      data: [{ id: 1, name: 'EMPLOYEE', description: null }],
      total: 1,
      page: 1,
      limit: 100,
      has_more: false,
    });
    getChainMock.mockReset().mockResolvedValue({ employee_id: 12, l1: null, l2: null });
    setChainMock.mockReset().mockResolvedValue({ l1_approver_id: 5, l2_approver_id: null });
  });

  it('seeds the L1 select from the active chain', async () => {
    getChainMock.mockResolvedValue({
      employee_id: 12,
      l1: {
        id: 1,
        employee_id: 12,
        step: 1,
        approver_id: 5,
        effective_at: '',
        ended_at: null,
        created_by: null,
        updated_by: null,
        created_at: '',
        updated_at: '',
      },
      l2: null,
    });
    renderDrawer();
    const l1 = await screen.findByRole('button', { name: /level 1 approver/i });
    await waitFor(() => expect(l1).toHaveTextContent('Grace Hopper'));
  });

  it('excludes the employee being edited from the approver options', async () => {
    renderDrawer();
    const l1 = await screen.findByRole('button', { name: /level 1 approver/i });
    await waitFor(() => expect(listUsersMock).toHaveBeenCalled());
    await userEvent.click(l1);
    const listbox = await screen.findByRole('listbox', { name: /level 1 approver/i });
    expect(within(listbox).queryByText('Ada Lovelace')).not.toBeInTheDocument();
    expect(within(listbox).getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('on save with a changed chain, updates the profile then sets the chain', async () => {
    renderDrawer();
    const l1 = await screen.findByRole('button', { name: /level 1 approver/i });
    await waitFor(() => expect(listUsersMock).toHaveBeenCalled());
    await userEvent.click(l1);
    const listbox = await screen.findByRole('listbox', { name: /level 1 approver/i });
    await userEvent.click(within(listbox).getByText('Grace Hopper'));

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    await waitFor(() => expect(setChainMock).toHaveBeenCalledWith(12, { l1_approver_id: 5 }));
    // update ordered before setChain
    expect(updateMock.mock.invocationCallOrder[0]!).toBeLessThan(
      setChainMock.mock.invocationCallOrder[0]!,
    );
  });

  it('does not call setChain when the chain is unchanged', async () => {
    renderDrawer();
    await screen.findByRole('button', { name: /level 1 approver/i });
    await waitFor(() => expect(listUsersMock).toHaveBeenCalled());
    // change a profile field so save is enabled
    const firstName = screen.getByLabelText(/first name/i);
    await userEvent.type(firstName, 'x');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    expect(setChainMock).not.toHaveBeenCalled();
  });
});
