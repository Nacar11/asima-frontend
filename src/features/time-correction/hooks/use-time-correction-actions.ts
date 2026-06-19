'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { timeCorrectionApi } from '@/features/time-correction/api';
import { timeCorrectionKeys } from '@/features/time-correction/keys';
import { approvalKeys } from '@/features/approvals/keys';
import { timeEntryKeys } from '@/features/time-entries/keys';
import type { UpdateCorrectionInput } from '@/features/time-correction/schemas';

/**
 * HR/approver lifecycle actions for a single correction (approve override,
 * reject with note, admin-cancel, admin-edit). Each shares the same cache
 * invalidation (correction + approvals + entry) and toasts success/error; the
 * component drives the UI follow-up (close / exit edit) via `.mutate()`
 * `onSuccess`.
 */
export function useTimeCorrectionActions(requestId: number | undefined) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: timeCorrectionKeys.all });
    void queryClient.invalidateQueries({ queryKey: approvalKeys.all });
    void queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
  };

  const requireId = () => {
    if (requestId == null) throw new Error('No correction selected');
    return requestId;
  };

  const approve = useMutation({
    mutationFn: () => timeCorrectionApi.approve(requireId()),
    onSuccess: () => {
      invalidate();
      toast.success('Correction approved.');
    },
    onError: () => toast.error('Could not approve the correction.'),
  });

  const reject = useMutation({
    mutationFn: (note: string) => timeCorrectionApi.reject(requireId(), note),
    onSuccess: () => {
      invalidate();
      toast.success('Correction rejected.');
    },
    onError: () => toast.error('Could not reject the correction.'),
  });

  const cancel = useMutation({
    mutationFn: () => timeCorrectionApi.admin.cancel(requireId()),
    onSuccess: () => {
      invalidate();
      toast.success('Correction cancelled.');
    },
    onError: () => toast.error('Could not cancel the correction.'),
  });

  const update = useMutation({
    mutationFn: (input: UpdateCorrectionInput) => timeCorrectionApi.admin.update(requireId(), input),
    onSuccess: () => {
      invalidate();
      toast.success('Correction updated.');
    },
    onError: () => toast.error('Could not update the correction.'),
  });

  return { approve, reject, cancel, update };
}
