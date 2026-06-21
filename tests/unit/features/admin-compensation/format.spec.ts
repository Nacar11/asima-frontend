import { describe, expect, it } from 'vitest';
import { effectiveRange, formatHourly, formatSalary } from '@/features/admin-compensation/format';

describe('compensation formatting', () => {
  it('formats a salary with thousands separators and 2 decimals', () => {
    expect(formatSalary(50000)).toContain('50,000.00');
  });

  it('formats an hourly rate with up to 4 decimals and a /hr suffix', () => {
    const s = formatHourly(239.6128);
    expect(s).toContain('239.6128');
    expect(s.endsWith('/hr')).toBe(true);
  });

  it('renders an effective range, using "present" for the active (open) row', () => {
    expect(effectiveRange('2026-06-01', null)).toBe('2026-06-01 → present');
    expect(effectiveRange('2026-06-01', '2026-06-30')).toBe('2026-06-01 → 2026-06-30');
  });
});
