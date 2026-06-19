'use client';

import { type QueryKey } from '@tanstack/react-query';
import { Select, type SelectOption } from '@/components/select';
import { useInlineApproverUpdate } from '@/features/admin-approvers/hooks/use-inline-approver-mutation';

/**
 * One inline-editable approver cell in the /admin/approvers table.
 *
 * Commits a single step (L1 or L2) via PATCH /admin/approvers/:id, with
 * an optimistic patch of the cached list that reverts on error. The
 * tri-state payload is built from `step`: a number sets the approver,
 * the "— None —" sentinel ('') clears it (null).
 */
export function InlineApproverCell({
  employeeId,
  step,
  currentApproverId,
  options,
  listQueryKey,
  disabled,
}: {
  employeeId: number;
  step: 1 | 2;
  currentApproverId: number | null;
  options: SelectOption<string>[];
  listQueryKey: QueryKey;
  disabled?: boolean;
}) {
  const mutation = useInlineApproverUpdate({ employeeId, step, options, listQueryKey });

  return (
    <Select<string>
      value={currentApproverId === null ? '' : String(currentApproverId)}
      onValueChange={(v) => mutation.mutate(v === '' ? null : Number(v))}
      options={options}
      ariaLabel={step === 1 ? 'Level 1 approver' : 'Level 2 approver'}
      placeholder="— None —"
      disabled={disabled || mutation.isPending}
      size="sm"
      className="w-full"
    />
  );
}
