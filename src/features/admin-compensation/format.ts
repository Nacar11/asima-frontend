/**
 * Money formatting for the compensation slice. The currency code comes from
 * the API payload (the backend's COMPENSATION_CURRENCY, surfaced on every
 * read) — defaulting to PHP for any caller that doesn't pass one. Formatters
 * are memoised per currency so components never re-instantiate Intl inline.
 */
const DEFAULT_CURRENCY = 'PHP';

const salaryCache = new Map<string, Intl.NumberFormat>();
const rateCache = new Map<string, Intl.NumberFormat>();

function salaryFormatter(currency: string): Intl.NumberFormat {
  let fmt = salaryCache.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    salaryCache.set(currency, fmt);
  }
  return fmt;
}

function rateFormatter(currency: string): Intl.NumberFormat {
  let fmt = rateCache.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
    rateCache.set(currency, fmt);
  }
  return fmt;
}

/** e.g. `₱50,000.00`. */
export function formatSalary(n: number, currency: string = DEFAULT_CURRENCY): string {
  return salaryFormatter(currency).format(n);
}

/** e.g. `₱239.6128/hr`. */
export function formatHourly(n: number, currency: string = DEFAULT_CURRENCY): string {
  return `${rateFormatter(currency).format(n)}/hr`;
}

/** A human range for an effective-dated row: `2026-06-01 → present` or `… → 2026-06-30`. */
export function effectiveRange(effective_from: string, effective_to: string | null): string {
  return `${effective_from} → ${effective_to ?? 'present'}`;
}
