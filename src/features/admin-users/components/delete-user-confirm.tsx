'use client';

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
import { cn } from '@/lib/cn';
import { adminUsersApi } from '@/features/admin-users/api';
import { adminUserKeys } from '@/features/admin-users/keys';
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
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('No user selected');
      return adminUsersApi.remove(user.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      toast.success('Employee deleted.');
      onClose();
    },
    onError: () => toast.error('Could not delete employee.'),
  });

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
            onClick={() => mutation.mutate()}
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
