import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApproversTable } from '@/features/admin-approvers/components/approvers-table';
import type { EmployeeChainView } from '@/features/admin-approvers/schemas';

const ROWS: EmployeeChainView[] = [
  {
    employee_id: 12,
    employee_name: 'Ada Lovelace',
    employee_email: 'ada@asima.test',
    l1_approver_id: null,
    l1_approver_name: null,
    l2_approver_id: null,
    l2_approver_name: null,
    updated_at: null,
  },
  {
    employee_id: 13,
    employee_name: 'Alan Turing',
    employee_email: 'alan@asima.test',
    l1_approver_id: null,
    l1_approver_name: null,
    l2_approver_id: null,
    l2_approver_name: null,
    updated_at: null,
  },
];

function renderTable(props: Partial<React.ComponentProps<typeof ApproversTable>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onToggleOne = vi.fn();
  const onTogglePage = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <ApproversTable
        rows={ROWS}
        candidates={[]}
        listQueryKey={['admin-approvers']}
        canUpdate
        selectedIds={new Set<number>()}
        onToggleOne={onToggleOne}
        onTogglePage={onTogglePage}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { onToggleOne, onTogglePage };
}

describe('ApproversTable selection', () => {
  it('renders a checkbox per row plus a header checkbox when selectable', () => {
    renderTable();
    // 2 rows + 1 header = 3 checkboxes
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('toggling a row checkbox reports that employee id', async () => {
    const { onToggleOne } = renderTable();
    await userEvent.click(screen.getByRole('checkbox', { name: /select ada lovelace/i }));
    expect(onToggleOne).toHaveBeenCalledWith(12);
  });

  it('the header checkbox toggles the whole page', async () => {
    const { onTogglePage } = renderTable();
    await userEvent.click(screen.getByRole('checkbox', { name: /select all/i }));
    expect(onTogglePage).toHaveBeenCalledWith([12, 13], true);
  });

  it('does not render checkboxes when not selectable', () => {
    renderTable({ selectedIds: undefined, onToggleOne: undefined, onTogglePage: undefined });
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
});
