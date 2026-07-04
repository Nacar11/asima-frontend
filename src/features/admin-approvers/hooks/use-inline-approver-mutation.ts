'use client';

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SelectOption } from '@/components/select';
import { adminApproversApi } from '../api';
import type { EmployeeChainList, SetChainInput } from '../schemas';

/**
 * Commit a single approver step (L1 or L2) for one employee with an optimistic
 * patch of the cached list that reverts on error. The tri-state payload is
 * built from `step`: a number sets the approver, `null` clears it.
 */
export function useInlineApproverUpdate(args: {
  employeeId: number;
  step: 1 | 2;
  options: SelectOption<string>[];
  listQueryKey: QueryKey;
}) {
  const { employeeId, step, options, listQueryKey } = args;
  const queryClient = useQueryClient();

  return useMutation({
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
}
