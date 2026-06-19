'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { useDeleteAdminUser } from '@/features/admin-users/hooks/use-delete-user-mutation';
import type { AdminUser } from '@/features/admin-users/schemas';

export function DeleteUserConfirm({
  user,
  open,
  onClose,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const mutation = useDeleteAdminUser(user?.id);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete employee?</DialogTitle>
          <DialogDescription>
            Soft-delete{' '}
            <span className="font-medium text-neutral-950">
              {user?.first_name} {user?.last_name}
            </span>{' '}
            ({user?.email})? They won&apos;t be able to sign in. This can be reversed by an admin
            with database access.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate(undefined, { onSuccess: () => onClose() })}
            disabled={mutation.isPending}
            className={btnDanger}
          >
            {mutation.isPending ? 'Deleting…' : 'Delete'}
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
