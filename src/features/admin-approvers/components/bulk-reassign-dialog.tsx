'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { adminApproversApi } from '@/features/admin-approvers/api';

export type ApproverCandidate = { id: number; name: string };

/**
 * Org-wide reassignment: "wherever X is an active approver, replace with
 * Y." One call to POST /admin/approvers/bulk-reassign. The backend skips
 * rows where the employee IS Y (self-approval guard) and reports the
 * skipped count, which we surface in the toast.
 */
export function BulkReassignDialog({
  open,
  onClose,
  candidates,
}: {
  open: boolean;
  onClose: () => void;
  candidates: ApproverCandidate[];
}) {
  const queryClient = useQueryClient();
  const [from, setFrom] = useState<number | ''>('');
  const [to, setTo] = useState<number | ''>('');

  useEffect(() => {
    if (!open) {
      setFrom('');
      setTo('');
    }
  }, [open]);

  const options = [
    { value: '' as const, label: 'Select…' },
    ...candidates.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  const mutation = useMutation({
    mutationFn: () =>
      adminApproversApi.bulkReassign({
        from_approver_id: from as number,
        to_approver_id: to as number,
      }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-approvers'] });
      const skipped = result.skipped.length > 0 ? ` (${result.skipped.length} skipped)` : '';
      toast.success(`Reassigned ${result.reassigned} rows.${skipped}`);
      onClose();
    },
    onError: () => toast.error('Could not reassign approvers.'),
  });

  const canSubmit = from !== '' && to !== '' && from !== to && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk reassign approvers</DialogTitle>
          <DialogDescription>
            Replace one approver with another across every employee they currently approve for.
            Employees who would become their own approver are skipped automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="block text-sm font-medium text-neutral-800">Replace approver</span>
            <Select<string>
              value={from === '' ? '' : String(from)}
              onValueChange={(v) => setFrom(v === '' ? '' : Number(v))}
              options={options}
              ariaLabel="Replace approver"
              className="w-full"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="block text-sm font-medium text-neutral-800">With approver</span>
            <Select<string>
              value={to === '' ? '' : String(to)}
              onValueChange={(v) => setTo(v === '' ? '' : Number(v))}
              options={options}
              ariaLabel="With approver"
              className="w-full"
            />
          </label>
          {from !== '' && to !== '' && from === to && (
            <p className="text-xs text-red-600">
              The replacement must differ from the approver being replaced.
            </p>
          )}
        </div>

        <DialogFooter>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className={btnPrimary}
          >
            {mutation.isPending ? 'Reassigning…' : 'Reassign'}
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
