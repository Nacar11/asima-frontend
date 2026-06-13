'use client';

import { formatDateInTz, formatTimeInTz } from '@/lib/format';
import { durationMinutes, formatDuration, type TimeEntry } from '@/features/time-entries/schemas';
import {
  findScheduleForDate,
  scheduledRegularHours,
  tardinessMinutes,
  undertimeMinutes,
  deficitHours,
  timesheetStatus,
  approverStates,
  type ApproverLevelState,
  type TimesheetStatus,
} from '@/features/time-entries/metrics';
import type { WorkSchedule } from '@/features/schedule/schemas';
import type { TimeCorrectionRequest } from '@/features/time-correction/schemas';
import { cn } from '@/lib/cn';

/**
 * Daily attendance log. One row per time entry, with derived metrics
 * (tardiness / undertime / deficit hours / regular hours) computed against the
 * matching WorkSchedule row when one is in effect for the entry's date. Days
 * without a schedule row show "—" for derived columns rather than fabricating a
 * baseline. The Status / Approver columns and the Time-in/out diff are derived
 * from the matching correction (if any) for that day.
 */
export function EntriesTable({
  rows,
  schedules,
  onRequestCorrection,
  correctionsByDate,
}: {
  rows: TimeEntry[];
  schedules: WorkSchedule[];
  onRequestCorrection?: (entry: TimeEntry) => void;
  /**
   * `work_date` → the active (pending/approved) correction for that day. Drives
   * the merged Time in/out diff, the Status and Approver columns, and disables
   * "Request correction" on days that already have one — the server blocks a
   * second per day, so this just surfaces that rule in the UI.
   */
  correctionsByDate?: Map<string, TimeCorrectionRequest>;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
        No entries yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <Th>Date</Th>
            <Th>Time in/out</Th>
            <Th className="text-right">Tardiness</Th>
            <Th className="text-right">Undertime</Th>
            <Th className="text-right">Deficit (h)</Th>
            <Th className="text-right">Work hours</Th>
            <Th>Status</Th>
            <Th>Approver</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white">
          {rows.map((row) => {
            const correction = correctionsByDate?.get(row.work_date);
            const schedule = findScheduleForDate(schedules, row.work_date);
            const late = tardinessMinutes(row, schedule);
            const under = undertimeMinutes(row, schedule);
            const deficit = deficitHours(row, schedule);
            const worked = durationMinutes(row);
            const regular = scheduledRegularHours(schedule);
            const status = timesheetStatus(row, correction);
            const guarded = correctionsByDate?.has(row.work_date) ?? false;

            return (
              <tr key={row.id}>
                <Td className="font-medium">{formatDateInTz(row.time_in)}</Td>
                <Td>
                  <TimeInOutCell entry={row} correction={correction} />
                </Td>
                <Td className="text-right tabular-nums">
                  <MinutesCell minutes={late} kind="late" />
                </Td>
                <Td className="text-right tabular-nums">
                  <MinutesCell minutes={under} kind="under" />
                </Td>
                <Td className="text-right tabular-nums">
                  {deficit === null ? (
                    <span className="text-neutral-400">—</span>
                  ) : (
                    deficit.toFixed(2)
                  )}
                </Td>
                <Td className="text-right">
                  <div className="tabular-nums">{formatDuration(worked)}</div>
                  <div className="text-xs text-neutral-500">
                    {regular === null ? '—' : `${regular.toFixed(2)}h regular`}
                  </div>
                </Td>
                <Td>
                  <StatusBadge status={status} />
                </Td>
                <Td>
                  <ApproverCell correction={correction} />
                </Td>
                <Td className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => onRequestCorrection?.(row)}
                      disabled={guarded}
                      className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Request correction
                    </button>
                    {guarded && (
                      <span className="text-xs text-neutral-500">Correction requested</span>
                    )}
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Merged in/out cell. When a correction exists for the day, render the
 * `original → proposed` diff (the arrow shows whenever the correction proposes
 * a value for that side); otherwise just the recorded times. Open entries show
 * "—" for out.
 */
function TimeInOutCell({
  entry,
  correction,
}: {
  entry: TimeEntry;
  correction?: TimeCorrectionRequest;
}) {
  const inOrig = formatTimeInTz(entry.time_in);
  const outOrig = entry.time_out ? formatTimeInTz(entry.time_out) : '—';
  const inProposed = correction ? formatTimeInTz(correction.proposed_time_in) : null;
  const outProposed = correction?.proposed_time_out
    ? formatTimeInTz(correction.proposed_time_out)
    : null;
  return (
    <div className="font-mono text-xs leading-5">
      <div>
        in:&nbsp;{inOrig}
        {inProposed && <span className="text-neutral-500"> → {inProposed}</span>}
      </div>
      <div>
        out:&nbsp;{outOrig}
        {outProposed && <span className="text-neutral-500"> → {outProposed}</span>}
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<TimesheetStatus, string> = {
  ongoing: 'Ongoing',
  applied: 'Applied',
  approved: 'Approved',
  logged: 'Logged',
};
const STATUS_CLASS: Record<TimesheetStatus, string> = {
  ongoing: 'bg-blue-50 text-blue-700',
  applied: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  logged: 'bg-neutral-100 text-neutral-600',
};

function StatusBadge({ status }: { status: TimesheetStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_CLASS[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function ApproverCell({ correction }: { correction?: TimeCorrectionRequest }) {
  if (!correction) return <span className="text-neutral-400">—</span>;
  const { l1, l2 } = approverStates(correction);
  return (
    <div className="space-y-0.5 text-xs">
      <ApproverLine level="L1" name={correction.l1_approver_name ?? null} state={l1} />
      <ApproverLine level="L2" name={correction.l2_approver_name ?? null} state={l2} />
    </div>
  );
}

const STATE_MARK: Record<ApproverLevelState, string> = {
  pending: '⏳ pending',
  approved: '✓ approved',
  rejected: '✕ rejected',
  na: 'n/a',
};
const STATE_CLASS: Record<ApproverLevelState, string> = {
  pending: 'text-amber-700',
  approved: 'text-emerald-700',
  rejected: 'text-rose-700',
  na: 'text-neutral-400',
};

function ApproverLine({
  level,
  name,
  state,
}: {
  level: string;
  name: string | null;
  state: ApproverLevelState;
}) {
  return (
    <div>
      <span className="font-medium text-neutral-700">{level}:</span>{' '}
      {state === 'na' ? (
        <span className="text-neutral-400">n/a</span>
      ) : (
        <>
          <span className="text-neutral-800">{name ?? '—'}</span>{' '}
          <span className={STATE_CLASS[state]}>{STATE_MARK[state]}</span>
        </>
      )}
    </div>
  );
}

function MinutesCell({ minutes, kind }: { minutes: number | null; kind: 'late' | 'under' }) {
  if (minutes === null) return <span className="text-neutral-400">—</span>;
  if (minutes === 0) return <span className="text-neutral-500">0</span>;
  return (
    <span className={kind === 'late' ? 'text-amber-700' : 'text-rose-700'}>{minutes} min</span>
  );
}

const Th = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th
    scope="col"
    className={cn(
      'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600',
      className,
    )}
  >
    {children}
  </th>
);

const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={cn('px-4 py-2.5 text-sm text-neutral-800', className)}>{children}</td>
);
