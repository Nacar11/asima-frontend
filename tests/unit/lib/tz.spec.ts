import { describe, expect, it, vi, afterEach } from 'vitest';
import { resolveDisplayTz } from '@/lib/tz';

describe('resolveDisplayTz', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns Asia/Manila in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(resolveDisplayTz()).toBe('Asia/Manila');
  });

  it('returns the browser-local timezone in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone: 'America/New_York',
    } as Intl.ResolvedDateTimeFormatOptions);
    expect(resolveDisplayTz()).toBe('America/New_York');
  });

  it('returns the browser-local timezone in test', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone: 'Europe/Paris',
    } as Intl.ResolvedDateTimeFormatOptions);
    expect(resolveDisplayTz()).toBe('Europe/Paris');
  });
});
