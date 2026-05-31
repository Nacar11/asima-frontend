import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BulkReassignDialog } from '@/features/admin-approvers/components/bulk-reassign-dialog';

const bulkReassignMock = vi.fn();
vi.mock('@/features/admin-approvers/api', () => ({
  adminApproversApi: { bulkReassign: (...a: unknown[]) => bulkReassignMock(...a) },
}));
const toastSuccess = vi.fn();
vi.mock('sonner', () => ({ toast: { success: (...a: unknown[]) => toastSuccess(...a), error: vi.fn() } }));

const CANDIDATES = [
  { id: 5, name: 'Grace Hopper' },
  { id: 7, name: 'Alan Turing' },
];

function renderDialog() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BulkReassignDialog open onClose={vi.fn()} candidates={CANDIDATES} />
    </QueryClientProvider>,
  );
}

async function pick(label: RegExp, optionText: string) {
  await userEvent.click(screen.getByRole('button', { name: label }));
  const listbox = await screen.findByRole('listbox', { name: label });
  await userEvent.click(within(listbox).getByText(optionText));
}

describe('BulkReassignDialog', () => {
  beforeEach(() => {
    bulkReassignMock.mockReset().mockResolvedValue({ reassigned: 3, skipped: [] });
    toastSuccess.mockReset();
  });

  it('disables Reassign until from and to are chosen and differ', async () => {
    renderDialog();
    const confirm = screen.getByRole('button', { name: /^reassign$/i });
    expect(confirm).toBeDisabled();
    await pick(/replace approver/i, 'Grace Hopper');
    await pick(/with approver/i, 'Grace Hopper');
    expect(screen.getByRole('button', { name: /^reassign$/i })).toBeDisabled();
    await pick(/with approver/i, 'Alan Turing');
    expect(screen.getByRole('button', { name: /^reassign$/i })).toBeEnabled();
  });

  it('confirms with the chosen ids and toasts the count', async () => {
    renderDialog();
    await pick(/replace approver/i, 'Grace Hopper');
    await pick(/with approver/i, 'Alan Turing');
    await userEvent.click(screen.getByRole('button', { name: /^reassign$/i }));
    await waitFor(() =>
      expect(bulkReassignMock).toHaveBeenCalledWith({ from_approver_id: 5, to_approver_id: 7 }),
    );
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Reassigned 3 rows.'));
  });
});
