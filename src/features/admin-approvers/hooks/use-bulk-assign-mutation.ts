'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApproversApi } from '@/features/admin-approvers/api';
import { adminApproverKeys } from '@/features/admin-approvers/keys';
import type { BulkAssignInput } from '@/features/admin-approvers/schemas';

/**
 * Bulk-assign an L1 (and optional L2) approver to a set of employees.
 * Invalidates the approvers cache and toasts the SERVER's assigned/skipped
 * counts (never the requested count — the set can go stale). The dialog clears
 * selection + closes via the `.mutate()` `onSuccess`.
 */
export function useBulkAssignApprovers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkAssignInput) => adminApproversApi.bulkAssign(input),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: adminApproverKeys.all });
      const skipped = result.skipped.length > 0 ? ` (${result.skipped.length} skipped)` : '';
      toast.success(`Assigned ${result.assigned} employees.${skipped}`);
    },
    onError: () => toast.error('Could not assign approvers.'),
  });
}
