import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InlineApproverCell } from '@/features/admin-approvers/components/inline-approver-cell';

const setChainMock = vi.fn();
vi.mock('@/features/admin-approvers/api', () => ({
  adminApproversApi: { setChain: (...a: unknown[]) => setChainMock(...a) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const OPTIONS = [
  { value: '', label: '— None —' },
  { value: '5', label: 'Grace Hopper' },
  { value: '7', label: 'Alan Turing' },
];

function renderCell(props: Partial<React.ComponentProps<typeof InlineApproverCell>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <InlineApproverCell
        employeeId={12}
        step={1}
        currentApproverId={5}
        options={OPTIONS}
        listQueryKey={['admin-approvers', 'list']}
        disabled={false}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe('InlineApproverCell', () => {
  beforeEach(() => {
    setChainMock.mockReset().mockResolvedValue({ l1_approver_id: 7, l2_approver_id: null });
  });

  it('shows the current approver name', () => {
    renderCell();
    expect(screen.getByRole('button')).toHaveTextContent('Grace Hopper');
  });

  it('commits a step-1 change as l1_approver_id', async () => {
    renderCell();
    await userEvent.click(screen.getByRole('button'));
    const listbox = await screen.findByRole('listbox');
    await userEvent.click(within(listbox).getByText('Alan Turing'));
    await waitFor(() => expect(setChainMock).toHaveBeenCalledWith(12, { l1_approver_id: 7 }));
  });

  it('commits a step-2 change as l2_approver_id', async () => {
    renderCell({ step: 2, currentApproverId: null });
    await userEvent.click(screen.getByRole('button'));
    const listbox = await screen.findByRole('listbox');
    await userEvent.click(within(listbox).getByText('Alan Turing'));
    await waitFor(() => expect(setChainMock).toHaveBeenCalledWith(12, { l2_approver_id: 7 }));
  });

  it('clearing to None sends null', async () => {
    renderCell();
    await userEvent.click(screen.getByRole('button'));
    const listbox = await screen.findByRole('listbox');
    await userEvent.click(within(listbox).getByText('— None —'));
    await waitFor(() => expect(setChainMock).toHaveBeenCalledWith(12, { l1_approver_id: null }));
  });
});
