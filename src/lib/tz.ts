/**
 * Display timezone resolver (SPEC §11a).
 *
 *   - Production: hard-coded `Asia/Manila` so every employee sees the
 *     same wall-clock time regardless of where their laptop is.
 *   - Dev / test: browser-local. Dev laptops travel; localhost has no
 *     "company time" — render in whatever zone the runtime reports.
 *
 * The backend stores everything in UTC (`timestamptz`). The frontend
 * converts on display. Never call `Date.toLocaleString()` directly —
 * route through `lib/format.ts` so timezone policy lives in one place.
 */
const COMPANY_TZ = 'Asia/Manila';

export function resolveDisplayTz(): string {
  if (process.env.NODE_ENV === 'production') return COMPANY_TZ;
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
