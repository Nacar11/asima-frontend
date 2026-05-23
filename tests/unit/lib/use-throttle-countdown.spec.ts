import { describe, it, expect } from 'vitest';
import { formatCountdown } from '@/lib/use-throttle-countdown';

describe('formatCountdown', () => {
  it('renders zero as 0:00', () => {
    expect(formatCountdown(0)).toBe('0:00');
  });

  it('zero-pads single-digit seconds', () => {
    expect(formatCountdown(5)).toBe('0:05');
    expect(formatCountdown(65)).toBe('1:05');
  });

  it('handles multi-minute values', () => {
    expect(formatCountdown(125)).toBe('2:05');
    expect(formatCountdown(3599)).toBe('59:59');
  });
});
