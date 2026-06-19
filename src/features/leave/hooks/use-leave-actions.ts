'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leaveApi } from '@/features/leave/api';
import { leaveKeys } from '@/features/leave/keys';
import { approvalKeys } from '@/features/approvals/keys';
import type { UpdateLeaveInput } from '@/features/leave/schemas';

/**
 * HR/approver lifecycle actions for a single leave request (approve override,
 * reject with note, admin-cancel, admin-edit). Each shares the same cache
 * invalidation (leave + approvals) and toasts; the component drives the UI
 * follow-up (close / exit edit) via `.mutate()` `onSuccess`.
 */
export function useLeaveActions(requestId: number | undefined) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    void queryClient.invalidateQueries({ queryKey: approvalKeys.all });
  };

  const requireId = () => {
    if (requestId == null) throw new Error('No request selected');
    return requestId;
  };

  const approve = useMutation({
    mutationFn: () => leaveApi.approve(requireId()),
    onSuccess: () => {
      invalidate();
      toast.success('Request approved.');
    },
    onError: () => toast.error('Could not approve the request.'),
  });

  const reject = useMutation({
    mutationFn: (note: string) => leaveApi.reject(requireId(), note),
    onSuccess: () => {
      invalidate();
      toast.success('Request rejected.');
    },
    onError: () => toast.error('Could not reject the request.'),
  });

  const cancel = useMutation({
    mutationFn: () => leaveApi.admin.cancel(requireId()),
    onSuccess: () => {
      invalidate();
      toast.success('Request cancelled.');
    },
    onError: () => toast.error('Could not cancel the request.'),
  });

  const update = useMutation({
    mutationFn: (input: UpdateLeaveInput) => leaveApi.admin.update(requireId(), input),
    onSuccess: () => {
      invalidate();
      toast.success('Request updated.');
    },
    onError: () => toast.error('Could not update the request.'),
  });

  return { approve, reject, cancel, update };
}
