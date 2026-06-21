'use client';

import { useCompensationAudit } from '@/features/admin-compensation/hooks/use-compensation-audit';
import { auditActionLabel, describeAuditChange } from '@/features/admin-compensation/audit-format';

function whenStr(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

/**
 * Read-only audit trail for one compensation row — the before→after of every
 * write (set / correction / removal), newest first. Backs the "View changes"
 * affordance on the admin compensation manager.
 */
export function AuditTrailPanel({
  compensationId,
  currency,
}: {
  compensationId: number;
  currency: string;
}) {
  const { data, isLoading, error } = useCompensationAudit(compensationId);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-medium text-neutral-700">Change history</h3>

      {isLoading && <p className="mt-2 text-sm text-neutral-500">Loading…</p>}
      {error && <p className="mt-2 text-sm text-red-700">Couldn&apos;t load the change history.</p>}
      {data && data.length === 0 && (
        <p className="mt-2 text-sm text-neutral-500">No changes recorded yet.</p>
      )}

      {data && data.length > 0 && (
        <ul className="mt-3 divide-y divide-neutral-100">
          {data.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
            >
              <span className="inline-flex items-center gap-2">
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-700">
                  {auditActionLabel(e.action)}
                </span>
                <span className="text-neutral-800">{describeAuditChange(e, currency)}</span>
              </span>
              <span className="text-xs text-neutral-400">{whenStr(e.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
