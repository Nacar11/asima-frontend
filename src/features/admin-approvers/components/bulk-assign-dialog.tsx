'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select } from '@/components/select';
import { cn } from '@/lib/cn';
import { useBulkAssignApprovers } from '@/features/admin-approvers/hooks/use-bulk-assign-mutation';

export type ApproverCandidate = { id: number; name: string };

/**
 * Assign an L1 (required) and optional L2 approver to a set of employees in
 * one call to POST /admin/approvers/bulk-assign. The inverse of
 * BulkReassignDialog: the source is an explicit employee set (the table
 * selection), not an existing approver.
 *
 * The toast count comes from the SERVER response (`assigned` / `skipped`),
 * never from `employeeIds.length` — between selection and submit the set can
 * go stale (an id is no longer unassigned, or IS the chosen approver, which
 * the backend skips). Reporting the server's numbers keeps it honest.
 */
export function BulkAssignDialog({
  open,
  onClose,
  candidates,
  employeeIds,
  onAssigned,
}: {
  open: boolean;
  onClose: () => void;
  candidates: ApproverCandidate[];
  employeeIds: number[];
  onAssigned?: () => void;
}) {
  const [l1, setL1] = useState<number | ''>('');
  const [l2, setL2] = useState<number | ''>('');

  useEffect(() => {
    if (!open) {
      setL1('');
      setL2('');
    }
  }, [open]);

  const l1Options = [
    { value: '' as const, label: 'Select…' },
    ...candidates.map((c) => ({ value: String(c.id), label: c.name })),
  ];
  const l2Options = [
    { value: '' as const, label: '— None —' },
    ...candidates.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  const mutation = useBulkAssignApprovers();

  const submit = () =>
    mutation.mutate(
      {
        employee_ids: employeeIds,
        l1_approver_id: l1 as number,
        ...(l2 === '' ? {} : { l2_approver_id: l2 as number }),
      },
      {
        onSuccess: () => {
          onAssigned?.();
          onClose();
        },
      },
    );

  const canSubmit = l1 !== '' && employeeIds.length > 0 && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk assign approver</DialogTitle>
          <DialogDescription>
            Assign a Level 1 approver (and optionally Level 2) to the {employeeIds.length} selected{' '}
            {employeeIds.length === 1 ? 'employee' : 'employees'}. This overwrites any approver
            already set at that level. Employees who would become their own approver are skipped
            automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="block text-sm font-medium text-neutral-800">Level 1 approver</span>
            <Select<string>
              value={l1 === '' ? '' : String(l1)}
              onValueChange={(v) => setL1(v === '' ? '' : Number(v))}
              options={l1Options}
              ariaLabel="Level 1 approver"
              className="w-full"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="block text-sm font-medium text-neutral-800">
              Level 2 approver <span className="font-normal text-neutral-400">(optional)</span>
            </span>
            <Select<string>
              value={l2 === '' ? '' : String(l2)}
              onValueChange={(v) => setL2(v === '' ? '' : Number(v))}
              options={l2Options}
              ariaLabel="Level 2 approver"
              className="w-full"
            />
          </label>
        </div>

        <DialogFooter>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={!canSubmit} className={btnPrimary}>
            {mutation.isPending ? 'Assigning…' : 'Assign'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const btnPrimary = cn(
  'rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnSecondary = cn(
  'rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900',
);
