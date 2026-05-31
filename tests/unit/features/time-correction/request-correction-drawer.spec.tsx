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

const ENTRY: TimeEntry = {
  id: 88,
  employee_id: 12,
  work_date: '2026-06-10',
  time_in: '2026-06-10T09:00:00.000Z',
  time_out: '2026-06-10T18:00:00.000Z',
  source: 'manual',
  status: 'confirmed',
  notes: null,
  created_by: null,
  updated_by: null,
  deleted_by: null,
  created_at: '2026-06-10T09:00:00.000Z',
  updated_at: '2026-06-10T18:00:00.000Z',
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

  it('submits the correction with the target entry id and work date', async () => {
    renderDrawer();
    await userEvent.type(screen.getByLabelText(/reason/i), 'Forgot to clock in');
    await userEvent.click(screen.getByRole('button', { name: /submit correction/i }));
    await waitFor(() =>
      expect(submitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          target_entry_id: 88,
          work_date: '2026-06-10',
          reason: 'Forgot to clock in',
        }),
      ),
    );
    const payload = submitMock.mock.calls[0]![0];
    expect(typeof payload.proposed_time_in).toBe('string');
    expect(payload.proposed_time_in.length).toBeGreaterThan(0);
  });
});
