import type { NextConfig } from 'next';

/**
 * Next.js config — kept thin for v0.
 *
 * - `output: 'standalone'` produces a self-contained server in
 *   `.next/standalone/` for the multi-stage Docker image.
 * - `reactStrictMode` catches common mistakes in dev (double-render,
 *   side-effects in render).
 * - `headers()` adds the security headers called out in SPEC §8.
 *
 * CSP note: we deliberately omit a Content-Security-Policy header
 * here. Next 15 ships with inline scripts in the runtime
 * (next/script, hydration helpers) that require either a `nonce` or
 * `unsafe-inline` — neither is appropriate as a default. v1 will land
 * a strict CSP wired through middleware that injects a per-request
 * nonce.
 */
const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

/**
 * Fail a production build when the API base URL is missing.
 *
 * `lib/env.ts` intends this to be a hard error, but nothing in app code
 * calls `env()` — `lib/api-client.ts` reads `process.env` directly and
 * falls back to `http://localhost:3000/api/v1`. Without this guard a
 * deploy that forgot the variable (or scoped it to Production but not
 * Preview) builds green and ships that fallback to the browser, so every
 * visitor calls *their own* machine on port 3000. The failure surfaces as
 * an opaque network error with nothing in the build log to explain it —
 * and it looks like it works on a dev laptop, where something usually is
 * listening on 3000.
 *
 * Only guards production builds; `next dev` keeps the localhost fallback.
 */
function assertDeployEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!raw) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL is required for a production build. ' +
        'Set it to the deployed API root, e.g. https://<service>.onrender.com/api/v1 ' +
        '(on Vercel: Settings → Environment Variables, and make sure it is enabled ' +
        'for the environment being built).',
    );
  }

  try {
    new URL(raw);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_API_BASE_URL must be an absolute URL; received "${raw}".`,
    );
  }
}

assertDeployEnv();

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
