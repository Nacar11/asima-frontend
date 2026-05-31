import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmployeeLeavesPage } from '@/features/leave/components/employee-leaves-page';

const meListMock = vi.fn();
const meSubmitMock = vi.fn();
const meCancelMock = vi.fn();
vi.mock('@/features/leave/api', () => ({
  leaveApi: {
    me: {
      list: (...a: unknown[]) => meListMock(...a),
      submit: (...a: unknown[]) => meSubmitMock(...a),
      cancel: (...a: unknown[]) => meCancelMock(...a),
    },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const PENDING_ROW = {
  id: 1,
  employee_id: 12,
  leave_type: 'annual',
  start_date: '2026-06-01',
  end_date: '2026-06-05',
  reason: null,
  status: 'pending_l1',
  submitted_at: '2026-05-30T10:00:00.000Z',
  decided_at: null,
  decided_by: null,
  decision_note: null,
  decision_path: null,
  cancelled_at: null,
  cancelled_by: null,
  l1_approver_id: 5,
  l2_approver_id: null,
  created_at: '2026-05-30T10:00:00.000Z',
  updated_at: '2026-05-30T10:00:00.000Z',
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <EmployeeLeavesPage />
    </QueryClientProvider>,
  );
}

describe('EmployeeLeavesPage', () => {
  beforeEach(() => {
    meListMock.mockReset().mockResolvedValue({
      data: [PENDING_ROW], total: 1, page: 1, limit: 20, has_more: false,
    });
    meSubmitMock.mockReset().mockResolvedValue(PENDING_ROW);
    meCancelMock.mockReset().mockResolvedValue({ ...PENDING_ROW, status: 'cancelled' });
  });

  it('lists my leave requests with type and status', async () => {
    renderPage();
    // Wait for the list query (not the select option) before asserting.
    expect(await screen.findByText('Pending L1')).toBeInTheDocument();
    expect(screen.getAllByText('Annual').length).toBeGreaterThan(0);
  });

  it('submits a new leave request', async () => {
    renderPage();
    await screen.findByText('Annual');
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-07-01' } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-07-03' } });
    await userEvent.type(screen.getByLabelText(/reason/i), 'Trip');
    await userEvent.click(screen.getByRole('button', { name: /submit request/i }));
    await waitFor(() =>
      expect(meSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          leave_type: 'annual',
          start_date: '2026-07-01',
          end_date: '2026-07-03',
          reason: 'Trip',
        }),
      ),
    );
  });

  it('submits with a non-default leave type chosen from the select', async () => {
    renderPage();
    await screen.findByText('Annual');

    await userEvent.click(screen.getByRole('button', { name: /leave type/i }));
    const listbox = await screen.findByRole('listbox', { name: /leave type/i });
    await userEvent.click(within(listbox).getByText('Sick'));

    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-07-01' } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-07-03' } });
    await userEvent.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() =>
      expect(meSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({ leave_type: 'sick' }),
      ),
    );
  });

  it('cancels a pending request', async () => {
    renderPage();
    const cancelBtn = await screen.findByRole('button', { name: /^cancel$/i });
    await userEvent.click(cancelBtn);
    await waitFor(() => expect(meCancelMock).toHaveBeenCalledWith(1));
  });
});
