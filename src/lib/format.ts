import { formatDistanceToNow } from 'date-fns';
import { resolveDisplayTz } from '@/lib/tz';

/**
 * Single render path for every timestamp the user sees.
 *
 * Never call `Date.toLocaleString()` / `date-fns.format()` directly —
 * they default to browser-local. Use these helpers so the timezone
 * policy (Asia/Manila in prod, browser-local in dev) lives in one
 * place, and so v1 timezone changes are a one-file edit.
 */

const LOCALE = 'en-PH';

export function formatInTz(value: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: resolveDisplayTz(),
    ...opts,
  }).format(date);
}

/** "2026-05-23" — for the work_date column, scheduling labels, history filters. */
export function formatDateInTz(value: Date | string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: resolveDisplayTz(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(typeof value === 'string' ? new Date(value) : value);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

/** "09:00" — 24h time of day. */
export function formatTimeInTz(value: Date | string): string {
  return formatInTz(value, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** "May 23, 2026 · 09:00" — full human label for cards / tables. */
export function formatDateTimeInTz(value: Date | string): string {
  return formatInTz(value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * "2 minutes ago" — relative distance from now. Timezone-agnostic (a
 * duration, not a wall-clock time), so it doesn't go through `resolveDisplayTz`
 * — but it lives here so callers never import `date-fns` directly (one date
 * library, one render path).
 */
export function formatRelative(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return formatDistanceToNow(date, { addSuffix: true });
}
