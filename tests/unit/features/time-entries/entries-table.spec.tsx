import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntriesTable } from '@/features/time-entries/components/entries-table';
import type { TimeEntry } from '@/features/time-entries/schemas';

function entry(id: number, work_date: string): TimeEntry {
  const t = new Date(`${work_date}T09:00:00`).toISOString();
  return {
    id,
    employee_id: 12,
    work_date,
    time_in: t,
    time_out: new Date(`${work_date}T18:00:00`).toISOString(),
    source: 'manual',
    status: 'confirmed',
    notes: null,
    created_by: null,
    updated_by: null,
    deleted_by: null,
    created_at: t,
    updated_at: t,
    deleted_at: null,
  };
}

const ROWS = [entry(1, '2026-06-13'), entry(2, '2026-06-12')];

function rowFor(date: string) {
  // Find the <tr> containing the formatted date cell.
  return screen.getByText(date).closest('tr') as HTMLElement;
}

describe('EntriesTable — correction guard', () => {
  it('disables Request correction and shows a status for a day with an active correction', () => {
    render(<EntriesTable rows={ROWS} schedules={[]} correctedDates={new Set(['2026-06-13'])} />);

    const guarded = within(rowFor('2026-06-13'));
    expect(guarded.getByRole('button', { name: /request correction/i })).toBeDisabled();
    expect(guarded.getByText(/correction requested/i)).toBeInTheDocument();
  });

  it('keeps the button enabled for a day with no active correction', async () => {
    const onRequestCorrection = vi.fn();
    render(
      <EntriesTable
        rows={ROWS}
        schedules={[]}
        correctedDates={new Set(['2026-06-13'])}
        onRequestCorrection={onRequestCorrection}
      />,
    );

    const open = within(rowFor('2026-06-12')).getByRole('button', { name: /request correction/i });
    expect(open).not.toBeDisabled();
    await userEvent.click(open);
    expect(onRequestCorrection).toHaveBeenCalledTimes(1);
  });
});
