import { describe, expect, it } from 'vitest';
import { parseEnv } from '@/lib/env';

describe('parseEnv', () => {
  it('parses a valid env object', () => {
    const env = parseEnv({
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3000/api/v1',
      NEXT_PUBLIC_APP_NAME: 'asima',
    });
    expect(env.NEXT_PUBLIC_API_BASE_URL).toBe('http://localhost:3000/api/v1');
    expect(env.NEXT_PUBLIC_APP_NAME).toBe('asima');
  });

  it('falls back to defaults when APP_NAME is absent', () => {
    const env = parseEnv({ NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3000/api/v1' });
    expect(env.NEXT_PUBLIC_APP_NAME).toBe('asima');
  });

  it('throws when API_BASE_URL is missing', () => {
    expect(() => parseEnv({})).toThrow(/NEXT_PUBLIC_API_BASE_URL/);
  });

  it('throws when API_BASE_URL is not a URL', () => {
    expect(() => parseEnv({ NEXT_PUBLIC_API_BASE_URL: 'not-a-url' })).toThrow();
  });
});
