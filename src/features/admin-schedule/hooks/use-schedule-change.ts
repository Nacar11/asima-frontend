'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminScheduleApi } from '../api';
import { adminScheduleKeys } from '../keys';
import type { PreviewedCancel, ScheduleChangeIntent } from '../schemas';

/**
 * The two halves of the cascade flow: `preview` (dry-run, no toast — the
 * orchestrator opens the impact dialog with the result) and `apply` (commits;
 * invalidates the employee's schedule and toasts success). The 409 "drifted
 * since preview" case is handled by the caller, which re-runs preview.
 */
export function useScheduleChange(employeeId: number) {
  const queryClient = useQueryClient();

  const preview = useMutation({
    mutationFn: (intent: ScheduleChangeIntent) => adminScheduleApi.preview(intent),
  });

  const apply = useMutation({
    mutationFn: (vars: { intent: ScheduleChangeIntent; previewed: PreviewedCancel[] }) =>
      adminScheduleApi.apply(vars.intent, vars.previewed),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminScheduleKeys.byEmployee(employeeId) });
      toast.success('Schedule updated.');
    },
  });

  return { preview, apply };
}
