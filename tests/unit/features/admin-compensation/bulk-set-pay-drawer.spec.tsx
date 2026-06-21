import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BulkSetPayDrawer } from '@/features/admin-compensation/components/bulk-set-pay-drawer';

const createBulkMock = vi.fn();
vi.mock('@/features/admin-compensation/api', () => ({
  adminCompensationApi: { createBulk: (...a: unknown[]) => createBulkMock(...a) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Stub the employee picker. Each unpicked row shows one "pick employee" button;
// clicking it selects the next id from `picks`. Because only the empty row shows
// that button, there's never more than one to click at a time.
const picks: number[] = [];
vi.mock('@/features/admin-compensation/components/employee-picker', () => ({
  employeeName: (u: { id: number }) => `Emp ${u.id}`,
  EmployeePicker: ({
    selected,
    onSelect,
  }: {
    selected: { id: number } | null;
    onSelect: (u: { id: number; first_name: string; last_name: string }) => void;
  }) =>
    selected ? (
      <span>Emp {selected.id}</span>
    ) : (
      <button
        type="button"
        onClick={() => onSelect({ id: picks.shift() ?? 0, first_name: 'Emp', last_name: '' })}
      >
        pick employee
      </button>
    ),
}));

function renderDrawer(onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <BulkSetPayDrawer open onClose={onClose} />
    </QueryClientProvider>,
  );
  return { onClose };
}

describe('BulkSetPayDrawer', () => {
  beforeEach(() => {
    createBulkMock.mockReset().mockResolvedValue([{ id: 1 }, { id: 2 }]);
    picks.length = 0;
  });

  it('submits one item per completed row with the shared effective date', async () => {
    const { onClose } = renderDrawer();

    picks.push(1);
    await userEvent.click(screen.getByRole('button', { name: /pick employee/i }));
    await userEvent.click(screen.getByRole('button', { name: /add employee/i }));
    picks.push(2);
    await userEvent.click(screen.getByRole('button', { name: /pick employee/i }));

    const salaries = screen.getAllByLabelText(/monthly salary/i);
    await userEvent.type(salaries[0]!, '50000');
    await userEvent.type(salaries[1]!, '60000');

    await userEvent.click(screen.getByRole('button', { name: /^set pay/i }));

    await waitFor(() => expect(createBulkMock).toHaveBeenCalledTimes(1));
    const items = createBulkMock.mock.calls[0]![0] as Array<{
      employee_id: number;
      monthly_salary: number;
    }>;
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ employee_id: 1, monthly_salary: 50000 });
    expect(items[1]).toMatchObject({ employee_id: 2, monthly_salary: 60000 });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('blocks submit when the same employee is picked twice', async () => {
    renderDrawer();

    picks.push(1);
    await userEvent.click(screen.getByRole('button', { name: /pick employee/i }));
    await userEvent.click(screen.getByRole('button', { name: /add employee/i }));
    picks.push(1); // same employee again
    await userEvent.click(screen.getByRole('button', { name: /pick employee/i }));

    const salaries = screen.getAllByLabelText(/monthly salary/i);
    await userEvent.type(salaries[0]!, '50000');
    await userEvent.type(salaries[1]!, '60000');

    expect(screen.getByText(/same employee/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^set pay/i })).toBeDisabled();
    expect(createBulkMock).not.toHaveBeenCalled();
  });
});
