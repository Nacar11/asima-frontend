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
import { cn } from '@/lib/cn';

/**
 * Note-capture dialog for rejecting an approval. The backend requires a
 * non-empty note (a rejection without a reason is unreviewable for the
 * employee), so Confirm stays disabled until one is typed.
 */
export function RejectApprovalDialog({
  open,
  summary,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  summary: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) setNote('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject request</DialogTitle>
          <DialogDescription>{summary}</DialogDescription>
        </DialogHeader>

        <label className="block space-y-1.5">
          <span className="block text-sm font-medium text-neutral-800">Rejection note</span>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
          />
        </label>

        <DialogFooter>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note.trim())}
            disabled={pending || note.trim().length === 0}
            className={btnDanger}
          >
            {pending ? 'Rejecting…' : 'Confirm reject'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const btnDanger = cn(
  'rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnSecondary = cn(
  'rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900',
);
