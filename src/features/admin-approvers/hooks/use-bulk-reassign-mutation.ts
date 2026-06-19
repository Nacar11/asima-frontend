'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApproversApi } from '@/features/admin-approvers/api';
import { adminApproverKeys } from '@/features/admin-approvers/keys';
import type { BulkReassignInput } from '@/features/admin-approvers/schemas';

/**
 * Org-wide approver reassignment ("replace X with Y everywhere"). Invalidates
 * the approvers cache and toasts the SERVER's reassigned/skipped counts. The
 * dialog closes via the `.mutate()` `onSuccess`.
 */
export function useBulkReassignApprovers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkReassignInput) => adminApproversApi.bulkReassign(input),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: adminApproverKeys.all });
      const skipped = result.skipped.length > 0 ? ` (${result.skipped.length} skipped)` : '';
      toast.success(`Reassigned ${result.reassigned} rows.${skipped}`);
    },
    onError: () => toast.error('Could not reassign approvers.'),
  });
}
