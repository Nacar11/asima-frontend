import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntriesTable } from '@/features/time-entries/components/entries-table';
import { dowFromWorkDate } from '@/features/time-entries/metrics';
import type { TimeEntry } from '@/features/time-entries/schemas';
import type { WorkSchedule } from '@/features/schedule/schemas';
import type { TimeCorrectionRequest } from '@/features/time-correction/schemas';

const isoOn = (date: string, t: string) => new Date(`${date}T${t}`).toISOString();

function entry(id: number, work_date: string, over: Partial<TimeEntry> = {}): TimeEntry {
  const t = isoOn(work_date, '09:00:00');
  return {
    id,
    employee_id: 12,
    work_date,
    time_in: t,
    time_out: isoOn(work_date, '18:00:00'),
    source: 'manual',
    status: 'confirmed',
    notes: null,
    created_by: null,
    updated_by: null,
    deleted_by: null,
    created_at: t,
    updated_at: t,
    deleted_at: null,
    ...over,
  };
}

function correction(
  work_date: string,
  over: Partial<TimeCorrectionRequest> = {},
): TimeCorrectionRequest {
  return {
    id: 99,
    employee_id: 12,
    target_entry_id: 1,
    work_date,
    proposed_time_in: isoOn(work_date, '09:00:00'),
    proposed_time_out: isoOn(work_date, '18:00:00'),
    reason: 'x',
    status: 'pending_l1',
    submitted_at: '',
    decided_at: null,
    decided_by: null,
    decision_note: null,
    decision_path: null,
    cancelled_at: null,
    cancelled_by: null,
    l1_approver_id: 5,
    l2_approver_id: 7,
    l1_approver_name: 'Jane Cruz',
    l2_approver_name: 'Bob Lim',
    created_at: '',
    updated_at: '',
    ...over,
  };
}

function scheduleFor(work_date: string, over: Partial<WorkSchedule> = {}): WorkSchedule {
  return {
    id: 1,
    employee_id: 12,
    day_of_week: dowFromWorkDate(work_date),
    expected_in: '09:00:00',
    expected_out: '18:00:00',
    break_minutes: 0,
    break_start: null,
    effective_from: '2020-01-01',
    effective_to: null,
    created_by: null,
    updated_by: null,
    deleted_by: null,
    created_at: '',
    updated_at: '',
    deleted_at: null,
    ...over,
  };
}

const ROWS = [entry(1, '2026-06-13'), entry(2, '2026-06-12')];

function rowFor(date: string) {
  // Find the <tr> containing the formatted date cell.
  return screen.getByText(date).closest('tr') as HTMLElement;
}

describe('EntriesTable — correction guard', () => {
  it('disables Request correction and shows a status for a day with an active correction', () => {
    render(
      <EntriesTable
        rows={ROWS}
        schedules={[]}
        correctionsByDate={new Map([['2026-06-13', correction('2026-06-13')]])}
      />,
    );

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
        correctionsByDate={new Map([['2026-06-13', correction('2026-06-13')]])}
        onRequestCorrection={onRequestCorrection}
      />,
    );

    const open = within(rowFor('2026-06-12')).getByRole('button', { name: /request correction/i });
    expect(open).not.toBeDisabled();
    await userEvent.click(open);
    expect(onRequestCorrection).toHaveBeenCalledTimes(1);
  });
});

describe('EntriesTable — status, time-in/out diff, deficit, approvers', () => {
  it('renders a merged Time in/out cell with original → proposed when a correction exists', () => {
    const rows = [entry(1, '2026-06-13', { time_in: isoOn('2026-06-13', '09:02:00') })];
    const corrections = new Map([
      [
        '2026-06-13',
        correction('2026-06-13', { proposed_time_in: isoOn('2026-06-13', '09:00:00') }),
      ],
    ]);
    render(<EntriesTable rows={rows} schedules={[]} correctionsByDate={corrections} />);

    const row = rowFor('2026-06-13');
    expect(row.textContent).toMatch(/09:02/);
    expect(row.textContent).toMatch(/→/);
    expect(row.textContent).toMatch(/09:00/);
    expect(within(row).getByText('Applied')).toBeInTheDocument();
  });

  it('shows Status "Ongoing" for an open entry', () => {
    const rows = [entry(1, '2026-06-13', { time_out: null })];
    render(<EntriesTable rows={rows} schedules={[]} correctionsByDate={new Map()} />);
    expect(within(rowFor('2026-06-13')).getByText('Ongoing')).toBeInTheDocument();
  });

  it('shows Deficit (h) to two decimals (one hour late → 1.00)', () => {
    const rows = [entry(1, '2026-06-13', { time_in: isoOn('2026-06-13', '10:00:00') })];
    render(
      <EntriesTable
        rows={rows}
        schedules={[scheduleFor('2026-06-13')]}
        correctionsByDate={new Map()}
      />,
    );
    expect(within(rowFor('2026-06-13')).getByText('1.00')).toBeInTheDocument();
  });

  it('shows L1/L2 approver names and per-level state', () => {
    const corrections = new Map([
      ['2026-06-13', correction('2026-06-13', { status: 'pending_l2' })],
    ]);
    render(
      <EntriesTable
        rows={[entry(1, '2026-06-13')]}
        schedules={[]}
        correctionsByDate={corrections}
      />,
    );

    const row = within(rowFor('2026-06-13'));
    expect(row.getByText(/Jane Cruz/)).toBeInTheDocument();
    expect(row.getByText(/Bob Lim/)).toBeInTheDocument();
  });
});
