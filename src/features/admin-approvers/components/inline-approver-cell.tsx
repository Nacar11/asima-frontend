'use client';

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Select, type SelectOption } from '@/components/select';
import { adminApproversApi } from '@/features/admin-approvers/api';
import type { EmployeeChainList, SetChainInput } from '@/features/admin-approvers/schemas';

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
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (approverId: number | null) => {
      const patch: SetChainInput =
        step === 1 ? { l1_approver_id: approverId } : { l2_approver_id: approverId };
      return adminApproversApi.setChain(employeeId, patch);
    },
    onMutate: async (approverId) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previous = queryClient.getQueryData<EmployeeChainList>(listQueryKey);
      const name = options.find((o) => o.value === String(approverId))?.label ?? null;
      queryClient.setQueryData<EmployeeChainList>(listQueryKey, (old) =>
        old
          ? {
              ...old,
              data: old.data.map((row) =>
                row.employee_id === employeeId
                  ? step === 1
                    ? { ...row, l1_approver_id: approverId, l1_approver_name: name }
                    : { ...row, l2_approver_id: approverId, l2_approver_name: name }
                  : row,
              ),
            }
          : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listQueryKey, ctx.previous);
      toast.error('Could not update approver.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
  });

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
