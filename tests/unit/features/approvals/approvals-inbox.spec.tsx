import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApprovalsInbox } from '@/features/approvals/components/approvals-inbox';
import type { PendingApproval } from '@/features/approvals/schemas';

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ status: 'authenticated', user: { id: 1, system_admin: false } }),
}));

const usePermissionsMock = vi.fn();
vi.mock('@/features/auth/use-permissions', () => ({
  usePermissions: () => usePermissionsMock(),
}));

const listPendingMock = vi.fn();
vi.mock('@/features/approvals/api', () => ({
  approvalsApi: { listPending: (...args: unknown[]) => listPendingMock(...args) },
}));

const approveMock = vi.fn();
const rejectMock = vi.fn();
vi.mock('@/features/approvals/actions', () => ({
  APPROVAL_ACTIONS: {
    leave: {
      approve: (...a: unknown[]) => approveMock(...a),
      reject: (...a: unknown[]) => rejectMock(...a),
    },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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

// Minimal stub drawer so we can drive the inbox wiring without a real fetch.
function StubDrawer({
  row,
  open,
  onClose,
  onApprove,
  onReject,
}: {
  row: PendingApproval | null;
  open: boolean;
  onClose: () => void;
  onApprove?: (row: PendingApproval) => void;
  onReject?: (row: PendingApproval) => void;
  busy?: boolean;
}) {
  if (!open || !row) return null;
  return (
    <div data-testid="stub-drawer">
      <span>drawer-row:{row.id}</span>
      <button type="button" onClick={() => onReject?.(row)}>
        drawer-reject
      </button>
      <button type="button" onClick={onClose}>
        drawer-close
      </button>
    </div>
  );
}

function renderInbox() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ApprovalsInbox
        type="leave"
        title="Pending Approvals (Leaves)"
        DetailDrawer={StubDrawer}
      />
    </QueryClientProvider>,
  );
}

describe('ApprovalsInbox', () => {
  beforeEach(() => {
    usePermissionsMock.mockReset().mockReturnValue({
      permissions: ['APPROVAL:View'],
      isLoading: false,
      isError: false,
    });
    listPendingMock.mockReset().mockResolvedValue({
      data: [ROW],
      total: 1,
      page: 1,
      limit: 20,
      has_more: false,
    });
    approveMock.mockReset().mockResolvedValue(undefined);
    rejectMock.mockReset().mockResolvedValue(undefined);
  });

  it('scopes the inbox query to its kind', async () => {
    renderInbox();
    await waitFor(() =>
      expect(listPendingMock).toHaveBeenCalledWith({ type: 'leave', page: 1, limit: 20 }),
    );
  });

  it('renders its title and the chain-scoped subtitle for a non-override approver', async () => {
    renderInbox();
    expect(screen.getByText('Pending Approvals (Leaves)')).toBeInTheDocument();
    expect(
      screen.getByText('Requests where you are the current approver.'),
    ).toBeInTheDocument();
  });

  it('opens the detail drawer for the clicked row', async () => {
    renderInbox();
    await userEvent.click(await screen.findByRole('button', { name: 'Details' }));
    expect(screen.getByText('drawer-row:9')).toBeInTheDocument();
  });

  it('approves from the table row via the kind action handler', async () => {
    renderInbox();
    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(approveMock).toHaveBeenCalledWith(9));
  });

  it('rejecting from the drawer closes it and opens the note dialog (no stacked overlays)', async () => {
    renderInbox();
    await userEvent.click(await screen.findByRole('button', { name: 'Details' }));
    await userEvent.click(screen.getByRole('button', { name: 'drawer-reject' }));

    // Drawer is gone, the reject dialog is up.
    expect(screen.queryByTestId('stub-drawer')).toBeNull();
    expect(screen.getByText('Reject request')).toBeInTheDocument();
  });
});
