'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { profileApi } from '@/features/profile/api';
import {
  ChangeMyPasswordInputSchema,
  type ChangeMyPasswordInput,
} from '@/features/profile/password-schemas';
import { ApiError } from '@/lib/api-client';
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

  const mutation = useMutation({
    mutationFn: (input: ChangeMyPasswordInput) =>
      profileApi.changePassword({
        current_password: input.current_password,
        new_password: input.new_password,
      }),
    onSuccess: () => {
      toast.success('Password updated.');
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
      if (err instanceof ApiError && err.status === 400) {
        const body = err.body as { message?: string | string[] } | null;
        const detail = Array.isArray(body?.message)
          ? body.message.join(', ')
          : (body?.message ?? 'Validation failed.');
        setServerError(detail);
        return;
      }
      setServerError('Could not update password. Please try again.');
    },
  });

  const onSubmit = form.handleSubmit((input) => mutation.mutate(input));
  const pending = mutation.isPending;
  const buttonDisabled = pending || throttle.locked;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Field
        label="Current password"
        id="current_password"
        type="password"
        autoComplete="current-password"
        error={form.formState.errors.current_password?.message}
        {...form.register('current_password')}
      />
      <Field
        label="New password"
        id="new_password"
        type="password"
        autoComplete="new-password"
        helper="At least 8 characters, with a lowercase, uppercase, digit, and symbol."
        error={form.formState.errors.new_password?.message}
        {...form.register('new_password')}
      />
      <Field
        label="Confirm new password"
        id="confirm_password"
        type="password"
        autoComplete="new-password"
        error={form.formState.errors.confirm_password?.message}
        {...form.register('confirm_password')}
      />

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

type FieldProps = {
  label: string;
  id: string;
  error?: string;
  helper?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Field = ({ label, id, error, helper, ...rest }: FieldProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-neutral-800">
      {label}
    </label>
    <input
      id={id}
      className={cn(
        'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm',
        'focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
      )}
      {...rest}
    />
    {helper && !error && <p className="text-xs text-neutral-500">{helper}</p>}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);
