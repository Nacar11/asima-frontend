'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leaveApi } from '@/features/leave/api';
import { leaveKeys } from '@/features/leave/keys';
import type { SubmitLeaveInput } from '@/features/leave/schemas';
import { errorMessage } from '@/lib/api-error';

/**
 * Submit a self-service leave request (optionally with a supporting file).
 * Invalidates my requests + balances and toasts; the component closes the
 * drawer via the `.mutate()` `onSuccess`.
 */
export function useSubmitLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { input: SubmitLeaveInput; file: File | null }) =>
      leaveApi.me.submit(vars.input, vars.file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveKeys.me() });
      void queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
      toast.success('Leave request submitted.');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not submit the request.')),
  });
}
