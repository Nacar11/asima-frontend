import { formatTimeInTz } from '@/lib/format';

/**
 * A single time value rendered as an `original → proposed` diff. The arrow
 * shows only when an original is present (a correction targeting an existing
 * entry); a new log (no original) shows just the proposed time. When neither
 * is present (e.g. an open segment with no time_out), renders `fallback`.
 *
 * Shared by the employee timesheet cell, the approvals-inbox summary, and the
 * approver detail drawer so the diff renders identically everywhere.
 */
export function TimeDiff({
  original,
  proposed,
  fallback = '—',
}: {
  original?: string | null;
  proposed?: string | null;
  fallback?: string;
}) {
  const o = original ? formatTimeInTz(original) : null;
  const p = proposed ? formatTimeInTz(proposed) : null;
  if (!o && !p) return <span className="text-neutral-400">{fallback}</span>;
  if (o && p) {
    return (
      <span className="font-mono text-xs">
        {o}
        <span className="text-neutral-400"> → </span>
        {p}
      </span>
    );
  }
  return <span className="font-mono text-xs">{o ?? p}</span>;
}

/** Stacked `in:` / `out:` diff block (timesheet cell + approvals summary). */
export function TimeInOutDiff({
  inOriginal,
  inProposed,
  outOriginal,
  outProposed,
}: {
  inOriginal?: string | null;
  inProposed?: string | null;
  outOriginal?: string | null;
  outProposed?: string | null;
}) {
  return (
    <div className="font-mono text-xs leading-5">
      <div>
        in:&nbsp;
        <TimeDiff original={inOriginal} proposed={inProposed} />
      </div>
      <div>
        out:&nbsp;
        <TimeDiff original={outOriginal} proposed={outProposed} />
      </div>
    </div>
  );
}
