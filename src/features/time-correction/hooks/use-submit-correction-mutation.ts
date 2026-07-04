'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { timeCorrectionApi, type SubmitCorrectionPayload } from '../api';
import { timeCorrectionKeys } from '../keys';
import { timeEntryKeys } from '@/features/time-entries';
import { errorMessage } from '@/lib/api-error';

/**
 * Submit a self-service correction request (a row edit or a missed-punch new
 * log — the caller builds the payload). Invalidates the correction + entry
 * caches and toasts. `successMessage`/`errorFallback` keep each drawer's copy
 * ("Log submitted…" vs "Correction request submitted."). The component closes
 * the drawer via the `.mutate()` `onSuccess`.
 */
export function useSubmitCorrection(opts: { successMessage: string; errorFallback: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitCorrectionPayload) => timeCorrectionApi.me.submit(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timeCorrectionKeys.all });
      void queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
      toast.success(opts.successMessage);
    },
    onError: (err) => toast.error(errorMessage(err, opts.errorFallback)),
  });
}
