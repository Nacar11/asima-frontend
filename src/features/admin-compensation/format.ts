/**
 * Money formatting for the compensation slice. Single-tenant PHP (the
 * backend's COMPENSATION_CURRENCY) — kept here as a pure, unit-testable
 * helper so components never re-instantiate Intl formatters inline.
 */
const salaryFmt = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const rateFmt = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

/** e.g. `₱50,000.00`. */
export function formatSalary(n: number): string {
  return salaryFmt.format(n);
}

/** e.g. `₱239.6128/hr`. */
export function formatHourly(n: number): string {
  return `${rateFmt.format(n)}/hr`;
}

/** A human range for an effective-dated row: `2026-06-01 → present` or `… → 2026-06-30`. */
export function effectiveRange(effective_from: string, effective_to: string | null): string {
  return `${effective_from} → ${effective_to ?? 'present'}`;
}
