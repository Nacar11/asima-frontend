'use client';

import { useEffect, useState } from 'react';
import { ApiClient, ApiError } from '@/lib/api-client';
import { AppShell, Card } from '@/components/layout/app-shell';

type HealthBody = { status: string; database?: string };

/**
 * Walking-skeleton sanity page. Verifies:
 *   1. Next.js boots on port 3001.
 *   2. Tailwind utilities render (look at the page).
 *   3. apiClient successfully reaches the backend's /health endpoint.
 *
 * Replaced in F2 with the proper landing route + redirect to /login.
 */
export default function HealthCheckPage() {
  const [state, setState] = useState<
    { kind: 'loading' } | { kind: 'ok'; body: HealthBody } | { kind: 'error'; message: string }
  >({ kind: 'loading' });

  useEffect(() => {
    // Construct a one-off client so this sanity page doesn't depend on
    // anything AuthProvider does later.
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';
    const client = new ApiClient({ baseUrl });
    client
      .get<HealthBody>('/health')
      .then((body) => setState({ kind: 'ok', body }))
      .catch((err: unknown) => {
        const message =
          err instanceof ApiError
            ? `${err.status} ${JSON.stringify(err.body)}`
            : err instanceof Error
              ? err.message
              : String(err);
        setState({ kind: 'error', message });
      });
  }, []);

  return (
    <AppShell
      actions={
        <span className="text-xs text-neutral-400">
          walking skeleton · replace with /login in F4
        </span>
      }
    >
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">asima walking skeleton</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Frontend boots. Tailwind works. Black-on-white theme applied. Below is the live response
          from{' '}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">
            GET /api/v1/health
          </code>{' '}
          on the backend.
        </p>

        <Card className="mt-8">
          {state.kind === 'loading' && <p className="text-neutral-500">Checking backend…</p>}

          {state.kind === 'ok' && (
            <div>
              <p className="font-medium text-emerald-700">Backend reachable</p>
              <pre className="mt-3 overflow-x-auto rounded bg-neutral-50 p-3 font-mono text-xs">
                {JSON.stringify(state.body, null, 2)}
              </pre>
            </div>
          )}

          {state.kind === 'error' && (
            <div>
              <p className="font-medium text-red-700">Backend unreachable</p>
              <p className="mt-2 text-sm text-neutral-700">{state.message}</p>
              <p className="mt-3 text-xs text-neutral-500">
                Check that <code className="text-neutral-800">asima-backend</code> is running on
                port 3000, and that{' '}
                <code className="text-neutral-800">CORS_ALLOWED_ORIGINS</code> in its{' '}
                <code className="text-neutral-800">.env</code> includes{' '}
                <code className="text-neutral-800">http://localhost:3001</code>.
              </p>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
