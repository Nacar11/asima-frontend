'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leaveApi } from '@/features/leave/api';
import { leaveKeys } from '@/features/leave/keys';

/** Cancel one of my own leave requests; invalidates my requests + balances. */
export function useCancelMyLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => leaveApi.me.cancel(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveKeys.me() });
      void queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
      toast.success('Leave request cancelled.');
    },
    onError: () => toast.error('Could not cancel the request.'),
  });
}
