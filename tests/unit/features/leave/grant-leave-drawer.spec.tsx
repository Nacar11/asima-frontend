import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GrantLeaveDrawer } from '@/features/leave/components/grant-leave-drawer';

const grantMock = vi.fn();
const balancesMock = vi.fn();
const allocationsMock = vi.fn();
vi.mock('@/features/leave/api', () => ({
  leaveApi: {
    admin: {
      grant: (...a: unknown[]) => grantMock(...a),
      balances: (...a: unknown[]) => balancesMock(...a),
      allocations: (...a: unknown[]) => allocationsMock(...a),
    },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const BALANCES = [
  { leave_type: 'vacation', allowance: 10, used: 0, reserved: 0, available: 10 },
  { leave_type: 'sick', allowance: 10, used: 0, reserved: 0, available: 10 },
  { leave_type: 'bereavement', allowance: 0, used: 0, reserved: 0, available: 0 },
  { leave_type: 'birthday', allowance: 0, used: 0, reserved: 0, available: 0 },
  { leave_type: 'emergency', allowance: 0, used: 0, reserved: 0, available: 0 },
];

function renderDrawer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <GrantLeaveDrawer
        employees={[{ id: 12, name: 'Emma Thompson' }]}
        open
        onClose={() => {}}
      />
    </QueryClientProvider>,
  );
}

describe('GrantLeaveDrawer', () => {
  beforeEach(() => {
    grantMock.mockReset().mockResolvedValue({ id: 1 });
    balancesMock.mockReset().mockResolvedValue(BALANCES);
    allocationsMock.mockReset().mockResolvedValue([]);
  });

  it('grants days to the selected employee', async () => {
    renderDrawer();

    await userEvent.selectOptions(screen.getByLabelText('Employee'), '12');
    // balances appear once an employee is chosen
    expect(await screen.findByText('Current balances')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText(/leave type/i), 'emergency');
    const days = screen.getByLabelText('Days');
    await userEvent.clear(days);
    await userEvent.type(days, '5');
    await userEvent.click(screen.getByRole('button', { name: /grant days/i }));

    await waitFor(() =>
      expect(grantMock).toHaveBeenCalledWith(
        12,
        expect.objectContaining({ leave_type: 'emergency', amount: 5 }),
      ),
    );
  });
});
