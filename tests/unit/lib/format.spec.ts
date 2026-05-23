import { describe, expect, it, vi, afterEach } from 'vitest';
import { formatInTz, formatDateInTz, formatTimeInTz } from '@/lib/format';

describe('formatInTz', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('renders an ISO timestamp in Asia/Manila when NODE_ENV=production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    // 2026-05-23T01:00:00Z = 2026-05-23 09:00 in Manila (UTC+8)
    const out = formatInTz('2026-05-23T01:00:00Z', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    expect(out).toContain('09:00');
  });

  it('renders an ISO timestamp in browser-local in dev', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone: 'UTC',
    } as Intl.ResolvedDateTimeFormatOptions);
    const out = formatInTz('2026-05-23T01:00:00Z', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    expect(out).toContain('01:00');
  });

  it('formatDateInTz returns a YYYY-MM-DD style date', () => {
    vi.stubEnv('NODE_ENV', 'production');
    // 2026-05-22T22:00:00Z = 2026-05-23 06:00 Manila → still 2026-05-23
    const out = formatDateInTz('2026-05-22T22:00:00Z');
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(out).toBe('2026-05-23');
  });

  it('formatTimeInTz returns HH:MM in 24h', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const out = formatTimeInTz('2026-05-23T01:00:00Z');
    expect(out).toBe('09:00');
  });
});
