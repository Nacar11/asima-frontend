import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddLogDrawer } from '@/features/time-correction/components/add-log-drawer';
import { localDateTimeToIso } from '@/features/time-correction/datetime';

const submitMock = vi.fn();
vi.mock('@/features/time-correction/api', () => ({
  timeCorrectionApi: { me: { submit: (...a: unknown[]) => submitMock(...a) } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderDrawer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AddLogDrawer open onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

async function fill(date: string, tin: string, tout: string, reason: string) {
  await userEvent.type(screen.getByLabelText(/date/i), date);
  await userEvent.type(screen.getByLabelText(/time in/i), tin);
  await userEvent.type(screen.getByLabelText(/time out/i), tout);
  await userEvent.type(screen.getByLabelText(/reason/i), reason);
}

describe('AddLogDrawer', () => {
  beforeEach(() => {
    submitMock.mockReset().mockResolvedValue({});
  });

  it('blocks a future date', async () => {
    renderDrawer();
    await fill('2099-01-01', '09:00', '18:00', 'late entry');
    await userEvent.click(screen.getByRole('button', { name: /add log/i }));
    expect(await screen.findByText(/future/i)).toBeInTheDocument();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('requires time-out after time-in', async () => {
    renderDrawer();
    await fill('2020-01-01', '18:00', '09:00', 'bad');
    await userEvent.click(screen.getByRole('button', { name: /add log/i }));
    expect(await screen.findByText(/time out must be after time in/i)).toBeInTheDocument();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('submits a manual log as a null-target correction with combined ISO times', async () => {
    renderDrawer();
    await fill('2020-01-02', '09:00', '18:00', 'Forgot to punch');
    await userEvent.click(screen.getByRole('button', { name: /add log/i }));
    await waitFor(() => expect(submitMock).toHaveBeenCalled());
    expect(submitMock.mock.calls[0]![0]).toEqual({
      target_entry_id: null,
      work_date: '2020-01-02',
      proposed_time_in: localDateTimeToIso('2020-01-02', '09:00'),
      proposed_time_out: localDateTimeToIso('2020-01-02', '18:00'),
      reason: 'Forgot to punch',
    });
  });
});
