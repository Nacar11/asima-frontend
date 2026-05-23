import { z } from 'zod';

/**
 * Parsed, validated env. Anything bundled into the client must be
 * `NEXT_PUBLIC_*` — server-only secrets never live here (there are
 * none in v0; the frontend has no backend secrets to hold).
 *
 * Failing to parse is intentionally a hard error: a misconfigured
 * `NEXT_PUBLIC_API_BASE_URL` would manifest as cryptic CORS or 404
 * failures at runtime, which is much harder to diagnose than a
 * startup explosion.
 */
const EnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('asima'),
});

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  return EnvSchema.parse(raw);
}

/**
 * Lazy singleton so tests can override env via `parseEnv` directly
 * without touching process.env.
 */
let cached: Env | null = null;
export function env(): Env {
  if (cached) return cached;
  cached = parseEnv({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  });
  return cached;
}
