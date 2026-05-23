'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { LoginInputSchema, type LoginInput } from '@/features/auth/schemas';
import { useAuth } from '@/features/auth/use-auth';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';

/**
 * Login form. SPEC §11b throttle UX:
 *   - On 429, parse Retry-After header (apiClient surfaces it on
 *     `ApiError.retryAfterSec`). Fall back to 60s.
 *   - Disable submit, show a live countdown ticking down in the form
 *     until zero, then re-enable.
 */
export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [throttleSecondsLeft, setThrottleSecondsLeft] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: { email: '', password: '' },
  });

  // Banner on session expiry — set by the (app) guard when refresh fails.
  useEffect(() => {
    if (search.get('reason') === 'expired') {
      toast.warning('Your session expired. Please sign in again.');
    }
  }, [search]);

  // Countdown tick for the 429 throttle banner.
  useEffect(() => {
    if (throttleSecondsLeft <= 0) return;
    const t = setInterval(() => setThrottleSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [throttleSecondsLeft]);

  const onSubmit = handleSubmit(async (input) => {
    setServerError(null);
    try {
      await login(input);
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        const wait = err.retryAfterSec ?? 60;
        setThrottleSecondsLeft(wait);
        setServerError(null);
        return;
      }
      if (err instanceof ApiError && err.status === 401) {
        setServerError('Invalid email or password.');
        return;
      }
      setServerError('Login failed. Please try again.');
    }
  });

  const locked = throttleSecondsLeft > 0;
  const buttonDisabled = isSubmitting || locked;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-neutral-800">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={cn(
            'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm',
            'focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950',
            errors.email && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          )}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-neutral-800">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={cn(
            'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm',
            'focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950',
            errors.password && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          )}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      {locked && (
        <p
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          Too many attempts. Try again in{' '}
          <span className="font-mono font-semibold">
            {formatCountdown(throttleSecondsLeft)}
          </span>
        </p>
      )}

      <button
        type="submit"
        disabled={buttonDisabled}
        className={cn(
          'w-full rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm',
          'transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
          buttonDisabled && 'cursor-not-allowed opacity-60 hover:bg-neutral-950',
        )}
      >
        {isSubmitting ? 'Signing in…' : locked ? 'Locked' : 'Sign in'}
      </button>
    </form>
  );
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
