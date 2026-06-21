'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminCompensationApi } from '@/features/admin-compensation/api';
import { adminCompensationKeys } from '@/features/admin-compensation/keys';
import { errorMessage } from '@/lib/api-error';
import type { CreateCompensationInput } from '@/features/admin-compensation/schemas';

/**
 * Bulk set-pay mutation (all-or-nothing). Invalidates the whole slice so every
 * affected employee re-reads, toasts the count on success, and surfaces the
 * backend's per-field message (e.g. the duplicate / bad-row 422) on failure.
 */
export function useBulkSetPay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: CreateCompensationInput[]) => adminCompensationApi.createBulk(items),
    onSuccess: (rows) => {
      void queryClient.invalidateQueries({ queryKey: adminCompensationKeys.all });
      toast.success(`Set pay for ${rows.length} employee${rows.length === 1 ? '' : 's'}.`);
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not set pay for the batch.')),
  });
}
