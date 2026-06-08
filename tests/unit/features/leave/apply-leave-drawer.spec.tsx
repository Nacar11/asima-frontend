import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApplyLeaveDrawer } from '@/features/leave/components/apply-leave-drawer';

const submitMock = vi.fn();
const dayCountMock = vi.fn();
vi.mock('@/features/leave/api', () => ({
  leaveApi: {
    me: {
      submit: (...a: unknown[]) => submitMock(...a),
      dayCountPreview: (...a: unknown[]) => dayCountMock(...a),
    },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderDrawer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ApplyLeaveDrawer open onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('ApplyLeaveDrawer — day portion', () => {
  beforeEach(() => {
    submitMock.mockReset().mockResolvedValue({ id: 1 });
    dayCountMock
      .mockReset()
      .mockResolvedValue({ working_days: 0.5, start_time: '09:00:00', end_time: '14:00:00' });
  });

  it('shows the day portion control immediately, before any dates are picked', () => {
    renderDrawer();
    expect(screen.getByRole('button', { name: /day portion/i })).toBeInTheDocument();
  });

  it('disables the end date and mirrors the start date when a half day is chosen', async () => {
    renderDrawer();
    fireEventChange(screen.getByLabelText(/start date/i), '2026-07-06');

    await userEvent.click(screen.getByRole('button', { name: /day portion/i }));
    const listbox = await screen.findByRole('listbox', { name: /day portion/i });
    await userEvent.click(within(listbox).getByText('First half'));

    const endInput = screen.getByLabelText(/end date/i) as HTMLInputElement;
    await waitFor(() => expect(endInput).toBeDisabled());
    expect(endInput.value).toBe('2026-07-06');
  });

  it('keeps the end date in sync with the start date while a half day is selected', async () => {
    renderDrawer();
    fireEventChange(screen.getByLabelText(/start date/i), '2026-07-06');

    await userEvent.click(screen.getByRole('button', { name: /day portion/i }));
    const listbox = await screen.findByRole('listbox', { name: /day portion/i });
    await userEvent.click(within(listbox).getByText('Second half'));

    // Move the start date — the disabled end date should follow it.
    fireEventChange(screen.getByLabelText(/start date/i), '2026-07-07');
    const endInput = screen.getByLabelText(/end date/i) as HTMLInputElement;
    await waitFor(() => expect(endInput.value).toBe('2026-07-07'));
  });

  it('hides the day portion control for a whole-day-only leave type (birthday)', async () => {
    renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: /leave type/i }));
    const listbox = await screen.findByRole('listbox', { name: /leave type/i });
    await userEvent.click(within(listbox).getByText('Birthday'));

    expect(screen.queryByRole('button', { name: /day portion/i })).not.toBeInTheDocument();
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
