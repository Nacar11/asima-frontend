'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Field } from '@/components/form/field';
import { cn } from '@/lib/cn';
import { useResetUserPassword } from '@/features/admin-users/hooks/use-reset-password-mutation';
import {
  ResetUserPasswordSchema,
  type AdminUser,
  type ResetUserPasswordInput,
} from '@/features/admin-users/schemas';

export function ResetPasswordDrawer({
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

  const mutation = useResetUserPassword(user?.id);

  const onSubmit = form.handleSubmit((input) =>
    mutation.mutate(input, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    }),
  );

  const title = `Reset password — ${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{title || 'Reset password'}</SheetTitle>
          <SheetDescription>
            Admin override — no current password required. Communicate the new password to the user
            out-of-band.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <form id="reset-password-form" onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="New password" error={form.formState.errors.new_password?.message}>
              <input
                type="text"
                autoComplete="off"
                className={inputCls}
                {...form.register('new_password')}
              />
            </Field>
          </form>
        </SheetBody>

        <SheetFooter>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            form="reset-password-form"
            disabled={mutation.isPending}
            className={btnPrimary}
          >
            {mutation.isPending ? 'Resetting…' : 'Reset password'}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
