import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BulkAssignDialog } from '@/features/admin-approvers/components/bulk-assign-dialog';

const bulkAssignMock = vi.fn();
vi.mock('@/features/admin-approvers/api', () => ({
  adminApproversApi: { bulkAssign: (...a: unknown[]) => bulkAssignMock(...a) },
}));
const toastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: vi.fn() },
}));

const CANDIDATES = [
  { id: 5, name: 'Grace Hopper' },
  { id: 7, name: 'Alan Turing' },
];

function renderDialog(props: Partial<React.ComponentProps<typeof BulkAssignDialog>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onClose = vi.fn();
  const onAssigned = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <BulkAssignDialog
        open
        onClose={onClose}
        onAssigned={onAssigned}
        candidates={CANDIDATES}
        employeeIds={[12, 13]}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { onClose, onAssigned };
}

async function pick(label: RegExp, optionText: string) {
  await userEvent.click(screen.getByRole('button', { name: label }));
  const listbox = await screen.findByRole('listbox', { name: label });
  await userEvent.click(within(listbox).getByText(optionText));
}

describe('BulkAssignDialog', () => {
  beforeEach(() => {
    bulkAssignMock.mockReset().mockResolvedValue({ assigned: 2, skipped: [] });
    toastSuccess.mockReset();
  });

  it('disables Assign until an L1 approver is chosen', async () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /^assign$/i })).toBeDisabled();
    await pick(/level 1 approver/i, 'Grace Hopper');
    expect(screen.getByRole('button', { name: /^assign$/i })).toBeEnabled();
  });

  it('assigns L1 only (L2 omitted) with the selected employee ids', async () => {
    renderDialog();
    await pick(/level 1 approver/i, 'Grace Hopper');
    await userEvent.click(screen.getByRole('button', { name: /^assign$/i }));
    await waitFor(() =>
      expect(bulkAssignMock).toHaveBeenCalledWith({
        employee_ids: [12, 13],
        l1_approver_id: 5,
      }),
    );
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Assigned 2 employees.'));
  });

  it('includes L2 when chosen and reports skipped in the toast', async () => {
    bulkAssignMock.mockResolvedValue({
      assigned: 1,
      skipped: [{ employee_id: 5, reason: 'self_approval' }],
    });
    const { onAssigned } = renderDialog();
    await pick(/level 1 approver/i, 'Grace Hopper');
    await pick(/level 2 approver/i, 'Alan Turing');
    await userEvent.click(screen.getByRole('button', { name: /^assign$/i }));
    await waitFor(() =>
      expect(bulkAssignMock).toHaveBeenCalledWith({
        employee_ids: [12, 13],
        l1_approver_id: 5,
        l2_approver_id: 7,
      }),
    );
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Assigned 1 employees. (1 skipped)'),
    );
    await waitFor(() => expect(onAssigned).toHaveBeenCalled());
  });
});
