'use client';

import { cn } from '@/lib/cn';
import { LEAVE_TYPE_LABELS } from '@/features/leave/format';
import type { LeaveBalance } from '@/features/leave/schemas';

/**
 * Per-type balance cards for /employee/leaves — available (prominent), with
 * used (approved) and pending (reserved) underneath. One card per leave type,
 * including the zero-balance types so the employee can see what's grantable.
 */
export function LeaveBalanceSummary({ balances }: { balances: LeaveBalance[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {balances.map((b) => (
        <div
          key={b.leave_type}
          className={cn(
            'rounded-lg border border-neutral-200 bg-white p-4',
            b.available === 0 && 'opacity-70',
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {LEAVE_TYPE_LABELS[b.leave_type]}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">{b.available}</p>
          <p className="text-xs text-neutral-500">available</p>
          <div className="mt-2 flex gap-3 text-xs text-neutral-500">
            <span aria-label="approved days">
              <span className="font-medium text-neutral-700 tabular-nums">{b.used}</span> used
            </span>
            <span aria-label="pending days">
              <span className="font-medium text-amber-700 tabular-nums">{b.reserved}</span> pending
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
