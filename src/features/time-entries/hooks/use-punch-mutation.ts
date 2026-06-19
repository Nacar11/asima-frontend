'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { timeEntriesApi } from '@/features/time-entries/api';
import { timeEntryKeys } from '@/features/time-entries/keys';
import { ApiError } from '@/lib/api-client';

/**
 * Toggle the current user's punch (clock in/out). Invalidates the entry cache
 * and owns the throttle (429) / already-updated (409) / generic error toasts.
 * The success toast (punch-in vs punch-out + tardiness) depends on component
 * state, so the page supplies it via the `.mutate()` `onSuccess`.
 */
export function usePunch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => timeEntriesApi.punch(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 429) {
        void queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
        toast.warning('Please wait 5 minutes between punches.');
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        void queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
        toast.warning('Punch state already updated — refreshed.');
        return;
      }
      toast.error('Could not punch. Try again.');
    },
  });
}
