import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata = {
  title: 'Sign in · asima',
};

/*
 * /login. Wrapped in Suspense because LoginForm reads useSearchParams,
 * which Next 15 requires to be inside a Suspense boundary for the
 * App Router's prerendering pass.
 */
export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-950">Sign in</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Enter your work email and password.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
