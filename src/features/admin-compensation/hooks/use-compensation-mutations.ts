'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminCompensationApi } from '@/features/admin-compensation/api';
import { adminCompensationKeys } from '@/features/admin-compensation/keys';
import { errorMessage } from '@/lib/api-error';
import type { CreateCompensationInput } from '@/features/admin-compensation/schemas';

/**
 * Set-pay and remove-rate mutations for one employee. Both invalidate that
 * employee's history so the manager re-renders the new active row. Errors
 * surface the backend's per-field message (e.g. future-date 422, or the
 * "only the active row can be deleted" 409).
 */
export function useCompensationMutations(employeeId: number) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminCompensationKeys.byEmployee(employeeId) });

  const setPay = useMutation({
    mutationFn: (input: CreateCompensationInput) => adminCompensationApi.create(input),
    onSuccess: () => {
      void invalidate();
      toast.success('Compensation updated.');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not update compensation.')),
  });

  const removeRate = useMutation({
    mutationFn: (id: number) => adminCompensationApi.remove(id),
    onSuccess: () => {
      void invalidate();
      toast.success('Current rate removed.');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not remove the rate.')),
  });

  return { setPay, removeRate };
}
