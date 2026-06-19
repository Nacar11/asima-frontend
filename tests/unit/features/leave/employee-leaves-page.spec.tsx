import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmployeeLeavesPage } from '@/features/leave/components/employee-leaves-page';

const meListMock = vi.fn();
const meSubmitMock = vi.fn();
const meCancelMock = vi.fn();
const meBalancesMock = vi.fn();
const meDayCountMock = vi.fn();
vi.mock('@/features/leave/api', () => ({
  leaveApi: {
    me: {
      list: (...a: unknown[]) => meListMock(...a),
      submit: (...a: unknown[]) => meSubmitMock(...a),
      cancel: (...a: unknown[]) => meCancelMock(...a),
      balances: (...a: unknown[]) => meBalancesMock(...a),
      dayCountPreview: (...a: unknown[]) => meDayCountMock(...a),
    },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ status: 'authenticated', user: { id: 1, system_admin: false } }),
}));

const PENDING_ROW = {
  id: 1,
  employee_id: 12,
  leave_type: 'vacation',
  start_date: '2026-06-01',
  end_date: '2026-06-05',
  working_days: 3,
  day_portion: 'full',
  start_time: null,
  end_time: null,
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

const BALANCES = [
  { leave_type: 'vacation', allowance: 10, used: 3, reserved: 2, available: 5 },
  { leave_type: 'sick', allowance: 10, used: 0, reserved: 0, available: 10 },
  { leave_type: 'bereavement', allowance: 0, used: 0, reserved: 0, available: 0 },
  { leave_type: 'birthday', allowance: 0, used: 0, reserved: 0, available: 0 },
  { leave_type: 'emergency', allowance: 0, used: 0, reserved: 0, available: 0 },
];

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
      data: [PENDING_ROW],
      total: 1,
      page: 1,
      limit: 20,
      has_more: false,
    });
    meSubmitMock.mockReset().mockResolvedValue(PENDING_ROW);
    meCancelMock.mockReset().mockResolvedValue({ ...PENDING_ROW, status: 'cancelled' });
    meBalancesMock.mockReset().mockResolvedValue(BALANCES);
    meDayCountMock.mockReset().mockResolvedValue({ working_days: 3 });
  });

  it('renders a balance card for every leave type, including zero-balance ones', async () => {
    renderPage();
    expect(await screen.findByText('Birthday')).toBeInTheDocument();
    expect(screen.getByText('Bereavement')).toBeInTheDocument();
    expect(screen.getByText('Emergency')).toBeInTheDocument();
  });

  it('lists my leave requests with type, days, and status', async () => {
    renderPage();
    expect(await screen.findByText('Pending L1')).toBeInTheDocument();
    expect(screen.getAllByText('Vacation').length).toBeGreaterThan(0);
    // working_days column + the date range identify the row
    expect(screen.getByText('2026-06-01 → 2026-06-05')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });

  it('submits a new request from the apply drawer with a live day count', async () => {
    renderPage();
    await screen.findByText('Pending L1');
    await userEvent.click(screen.getByRole('button', { name: /apply for leave/i }));

    const start = await screen.findByLabelText(/start date/i);
    fireEventChange(start, '2026-07-01');
    fireEventChange(await screen.findByLabelText(/end date/i), '2026-07-03');

    // live preview resolves → "This request is 3 working days"
    await waitFor(() =>
      expect(meDayCountMock).toHaveBeenCalledWith('2026-07-01', '2026-07-03', {
        day_portion: 'full',
        leave_type: 'vacation',
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() =>
      expect(meSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          leave_type: 'vacation',
          start_date: '2026-07-01',
          end_date: '2026-07-03',
        }),
        // vacation carries no attachment.
        null,
      ),
    );
  });

  it('submits a sick request with a required attachment chosen from the select', async () => {
    renderPage();
    await screen.findByText('Pending L1');
    await userEvent.click(screen.getByRole('button', { name: /apply for leave/i }));

    // The leave-type Select now lives inside the apply drawer.
    await userEvent.click(screen.getByRole('button', { name: /leave type/i }));
    const listbox = await screen.findByRole('listbox', { name: /leave type/i });
    await userEvent.click(within(listbox).getByText('Sick'));

    fireEventChange(await screen.findByLabelText(/start date/i), '2026-07-01');
    fireEventChange(await screen.findByLabelText(/end date/i), '2026-07-01');

    // sick requires a file — submit stays disabled until one is attached.
    expect(screen.getByRole('button', { name: /submit request/i })).toBeDisabled();
    const file = new File(['bytes'], 'cert.png', { type: 'image/png' });
    await userEvent.upload(screen.getByLabelText(/attachment/i), file);

    await userEvent.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() =>
      expect(meSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({ leave_type: 'sick' }),
        file,
      ),
    );
  });

  it('cancels a request whose leave has not yet elapsed', async () => {
    // canCancel now also checks the leave isn't fully in the past, so the row
    // must end on/after today for the Cancel button to render.
    meListMock.mockResolvedValue({
      data: [{ ...PENDING_ROW, end_date: '2099-12-31' }],
      total: 1,
      page: 1,
      limit: 20,
      has_more: false,
    });
    renderPage();
    const cancelBtn = await screen.findByRole('button', { name: /^cancel$/i });
    await userEvent.click(cancelBtn);
    await waitFor(() => expect(meCancelMock).toHaveBeenCalledWith(1));
  });
});

// date inputs don't play nicely with userEvent.type; set the value directly.
function fireEventChange(el: HTMLElement, value: string) {
  const input = el as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}
