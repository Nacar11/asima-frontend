import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequestCorrectionDrawer } from '@/features/time-correction/components/request-correction-drawer';
import type { TimeEntry } from '@/features/time-entries/schemas';

const submitMock = vi.fn();
vi.mock('@/features/time-correction/api', () => ({
  timeCorrectionApi: { me: { submit: (...a: unknown[]) => submitMock(...a) } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Build the instants from LOCAL 09:00 / 18:00 so the entry is same-day in any
// timezone the test runs in (a literal ...09:00Z is overnight in UTC+8).
const TIME_IN = new Date(2026, 5, 10, 9, 0, 0).toISOString();
const TIME_OUT = new Date(2026, 5, 10, 18, 0, 0).toISOString();

const ENTRY: TimeEntry = {
  id: 88,
  employee_id: 12,
  work_date: '2026-06-10',
  time_in: TIME_IN,
  time_out: TIME_OUT,
  source: 'manual',
  status: 'confirmed',
  notes: null,
  created_by: null,
  updated_by: null,
  deleted_by: null,
  created_at: TIME_IN,
  updated_at: TIME_OUT,
  deleted_at: null,
};

function renderDrawer(entry: TimeEntry | null = ENTRY) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RequestCorrectionDrawer entry={entry} open={entry !== null} onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('RequestCorrectionDrawer', () => {
  beforeEach(() => {
    submitMock.mockReset().mockResolvedValue({});
  });

  it('prefills the time-in field from the entry', () => {
    renderDrawer();
    expect((screen.getByLabelText(/time in/i) as HTMLInputElement).value).not.toBe('');
  });

  it('requires a reason before submitting', async () => {
    renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: /submit correction/i }));
    expect(submitMock).not.toHaveBeenCalled();
    expect(await screen.findByText(/a reason is required/i)).toBeInTheDocument();
  });

  it('exposes only time inputs — the date is locked (not editable)', () => {
    renderDrawer();
    expect((screen.getByLabelText(/time in/i) as HTMLInputElement).type).toBe('time');
    expect((screen.getByLabelText(/time out/i) as HTMLInputElement).type).toBe('time');
  });

  it('submits with the target id + work date, and round-trips unchanged times exactly', async () => {
    renderDrawer();
    await userEvent.type(screen.getByLabelText(/reason/i), 'Forgot to clock in');
    await userEvent.click(screen.getByRole('button', { name: /submit correction/i }));
    await waitFor(() => expect(submitMock).toHaveBeenCalled());
    const payload = submitMock.mock.calls[0]![0];
    expect(payload).toMatchObject({
      target_entry_id: 88,
      work_date: '2026-06-10',
      reason: 'Forgot to clock in',
      // Untouched time fields reproduce the original instants (Fix #3).
      proposed_time_in: TIME_IN,
      proposed_time_out: TIME_OUT,
    });
  });

  it('blocks time-out earlier than time-in (same-day rule)', async () => {
    renderDrawer();
    const timeOut = screen.getByLabelText(/time out/i);
    await userEvent.clear(timeOut);
    await userEvent.type(timeOut, '00:30');
    await userEvent.type(screen.getByLabelText(/reason/i), 'bad');
    await userEvent.click(screen.getByRole('button', { name: /submit correction/i }));
    expect(await screen.findByText(/time out must be after time in/i)).toBeInTheDocument();
    expect(submitMock).not.toHaveBeenCalled();
  });
});
