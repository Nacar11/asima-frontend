'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leaveApi } from '../api';
import { leaveKeys } from '../keys';
import type { GrantAllocationInput } from '../schemas';
import { errorMessage } from '@/lib/api-error';

/**
 * Admin grant of leave days to an employee (append-only). Invalidates that
 * employee's balances + grant history and toasts; the component resets the
 * form via the `.mutate()` `onSuccess`.
 */
export function useGrantLeave(employeeId: number | '') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GrantAllocationInput) => leaveApi.admin.grant(employeeId as number, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveKeys.adminBalances(employeeId) });
      void queryClient.invalidateQueries({ queryKey: leaveKeys.adminAllocations(employeeId) });
      toast.success('Leave granted.');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not grant leave.')),
  });
}
