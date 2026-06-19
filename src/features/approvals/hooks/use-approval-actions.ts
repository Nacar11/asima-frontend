'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { APPROVAL_ACTIONS } from '@/features/approvals/actions';
import { approvalKeys } from '@/features/approvals/keys';
import type { PendingApproval } from '@/features/approvals/schemas';

/**
 * Approve / reject the current approver's pending requests. The per-kind
 * handler (leave vs time-correction) is resolved from APPROVAL_ACTIONS by the
 * row's `kind`. Both invalidate the approvals cache and toast; the inbox clears
 * its selected/rejecting state via the `.mutate()` `onSuccess`.
 */
export function useApprovalActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: approvalKeys.all });

  const approve = useMutation({
    mutationFn: (row: PendingApproval) => {
      const handlers = APPROVAL_ACTIONS[row.kind];
      if (!handlers) throw new Error(`No approve handler for kind ${row.kind}`);
      return handlers.approve(row.id);
    },
    onSuccess: () => {
      void invalidate();
      toast.success('Request approved.');
    },
    onError: () => toast.error('Could not approve the request.'),
  });

  const reject = useMutation({
    mutationFn: ({ row, note }: { row: PendingApproval; note: string }) => {
      const handlers = APPROVAL_ACTIONS[row.kind];
      if (!handlers) throw new Error(`No reject handler for kind ${row.kind}`);
      return handlers.reject(row.id, note);
    },
    onSuccess: () => {
      void invalidate();
      toast.success('Request rejected.');
    },
    onError: () => toast.error('Could not reject the request.'),
  });

  return { approve, reject };
}
