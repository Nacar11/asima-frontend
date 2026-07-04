'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field } from '@/components/form/field';
import { useChangePassword } from '../hooks/use-change-password-mutation';
import { ChangeMyPasswordInputSchema, type ChangeMyPasswordInput } from '../password-schemas';
import { ApiError } from '@/lib/api-client';
import { errorMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { useThrottleCountdown } from '@/lib/use-throttle-countdown';

/*
 * Password change. Hits PATCH /users/me/password — throttled to 5/min
 * on the backend, so we use the same useThrottleCountdown hook as
 * /login for the 429 banner.
 *
 * On success the form resets so the user can immediately set another
 * password if they wanted to (rare, but the reset avoids "did it
 * actually work?" ambiguity).
 */
export function PasswordChangeForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const throttle = useThrottleCountdown();

  const form = useForm<ChangeMyPasswordInput>({
    resolver: zodResolver(ChangeMyPasswordInputSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  const mutation = useChangePassword();

  const onSubmit = form.handleSubmit((input) =>
    mutation.mutate(
      { current_password: input.current_password, new_password: input.new_password },
      {
        onSuccess: () => {
          form.reset();
          setServerError(null);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 429) {
            throttle.arm(err.retryAfterSec ?? 60);
            setServerError(null);
            return;
          }
          if (err instanceof ApiError && err.status === 401) {
            setServerError('Current password is incorrect.');
            return;
          }
          setServerError(errorMessage(err, 'Could not update password. Please try again.'));
        },
      },
    ),
  );

  const pending = mutation.isPending;
  const buttonDisabled = pending || throttle.locked;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Field
        label="Current password"
        htmlFor="current_password"
        error={form.formState.errors.current_password?.message}
      >
        <input
          id="current_password"
          type="password"
          autoComplete="current-password"
          className={inputCls(!!form.formState.errors.current_password)}
          {...form.register('current_password')}
        />
      </Field>
      <Field
        label="New password"
        htmlFor="new_password"
        helper="At least 8 characters, with a lowercase, uppercase, digit, and symbol."
        error={form.formState.errors.new_password?.message}
      >
        <input
          id="new_password"
          type="password"
          autoComplete="new-password"
          className={inputCls(!!form.formState.errors.new_password)}
          {...form.register('new_password')}
        />
      </Field>
      <Field
        label="Confirm new password"
        htmlFor="confirm_password"
        error={form.formState.errors.confirm_password?.message}
      >
        <input
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          className={inputCls(!!form.formState.errors.confirm_password)}
          {...form.register('confirm_password')}
        />
      </Field>

      {serverError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      {throttle.locked && (
        <p
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          Too many attempts. Try again in{' '}
          <span className="font-mono font-semibold">{throttle.formatted}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={buttonDisabled}
        className={cn(
          'inline-flex items-center rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
          'transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
          buttonDisabled && 'cursor-not-allowed opacity-60 hover:bg-neutral-950',
        )}
      >
        {pending ? 'Updating…' : throttle.locked ? 'Locked' : 'Update password'}
      </button>
    </form>
  );
}

const inputCls = (error: boolean) =>
  cn(
    'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm',
    'focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950',
    error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
  );
