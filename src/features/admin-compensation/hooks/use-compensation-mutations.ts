'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminCompensationApi } from '../api';
import { adminCompensationKeys } from '../keys';
import { errorMessage } from '@/lib/api-error';
import type { CreateCompensationInput, UpdateCompensationInput } from '../schemas';

/**
 * Set-pay, correct-in-place and remove-rate mutations for one employee. All
 * invalidate that employee's history so the manager re-renders the new active
 * row. Errors surface the backend's per-field message (e.g. future-date 422,
 * or the "only the active row can be deleted" 409).
 *
 * `setPay` records a real pay change (new effective-dated row); `correctRate`
 * fixes an erroneous row IN PLACE (no new history) via PATCH.
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

  const correctRate = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: UpdateCompensationInput }) =>
      adminCompensationApi.update(id, patch),
    onSuccess: () => {
      void invalidate();
      toast.success('Rate corrected.');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not correct the rate.')),
  });

  const removeRate = useMutation({
    mutationFn: (id: number) => adminCompensationApi.remove(id),
    onSuccess: () => {
      void invalidate();
      toast.success('Current rate removed.');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not remove the rate.')),
  });

  return { setPay, correctRate, removeRate };
}
