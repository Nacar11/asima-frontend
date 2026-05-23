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
