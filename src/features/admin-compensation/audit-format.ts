import { formatSalary } from '@/features/admin-compensation/format';
import type { CompensationAudit } from '@/features/admin-compensation/schemas';

const ACTION_LABELS: Record<CompensationAudit['action'], string> = {
  created: 'Set',
  updated: 'Correction',
  deleted: 'Removed',
};

/** Human label for an audit action — what HR sees as the entry's heading. */
export function auditActionLabel(action: CompensationAudit['action']): string {
  return ACTION_LABELS[action];
}

/**
 * One-line description of what an audit entry changed, in terms of the
 * monthly salary (the canonical figure): a set, a `before → after` correction,
 * or a removal with the prior value.
 */
export function describeAuditChange(entry: CompensationAudit, currency: string): string {
  const { before_monthly_salary: before, after_monthly_salary: after } = entry;
  switch (entry.action) {
    case 'created':
      return after != null ? `Set to ${formatSalary(after, currency)}` : 'Set';
    case 'updated':
      if (before != null && after != null) {
        return `${formatSalary(before, currency)} → ${formatSalary(after, currency)}`;
      }
      return after != null ? `→ ${formatSalary(after, currency)}` : 'Corrected';
    case 'deleted':
      return before != null ? `Removed (was ${formatSalary(before, currency)})` : 'Removed';
  }
}
