'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog } from '@/components/dialog';
import { cn } from '@/lib/cn';
import { adminUsersApi } from '@/features/admin-users/api';
import {
  ResetUserPasswordSchema,
  type AdminUser,
  type ResetUserPasswordInput,
} from '@/features/admin-users/schemas';

export function ResetPasswordDialog({
  user,
  open,
  onClose,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const form = useForm<ResetUserPasswordInput>({
    resolver: zodResolver(ResetUserPasswordSchema),
    defaultValues: { new_password: '' },
  });

  const mutation = useMutation({
    mutationFn: (input: ResetUserPasswordInput) => {
      if (!user) throw new Error('No user selected');
      return adminUsersApi.resetPassword(user.id, input);
    },
    onSuccess: () => {
      toast.success('Password reset. Share the new password securely.');
      form.reset();
      onClose();
    },
    onError: () => toast.error('Could not reset password.'),
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Reset password — ${user?.first_name ?? ''} ${user?.last_name ?? ''}`}
      description="Admin override — no current password required. Communicate the new password to the user out-of-band."
    >
      <form onSubmit={form.handleSubmit((input) => mutation.mutate(input))} className="space-y-4" noValidate>
        <label className="block space-y-1.5">
          <span className="block text-sm font-medium text-neutral-800">New password</span>
          <input
            type="text"
            autoComplete="off"
            className={inputCls}
            {...form.register('new_password')}
          />
          {form.formState.errors.new_password && (
            <span className="block text-xs text-red-600">
              {form.formState.errors.new_password.message}
            </span>
          )}
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending} className={btnPrimary}>
            {mutation.isPending ? 'Resetting…' : 'Reset password'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

const inputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950';

const btnPrimary = cn(
  'rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnSecondary = cn(
  'rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900',
);
