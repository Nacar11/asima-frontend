import type { NextConfig } from 'next';

/**
 * Next.js config — kept thin for v0.
 *
 * - `output: 'standalone'` produces a self-contained server in
 *   `.next/standalone/` for the multi-stage Docker image (F7).
 * - `reactStrictMode` catches common mistakes in dev (double-render,
 *   side-effects in render).
 * - Security headers will be added in F7 (CSP, X-Frame-Options,
 *   Referrer-Policy) — see SPEC.md §8.
 */
const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
