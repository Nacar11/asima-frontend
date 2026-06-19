import { describe, it, expect } from 'vitest';
import { approverLabel } from '@/lib/approver-label';

describe('approverLabel', () => {
  it('returns the plain name when the approver is not the viewer', () => {
    expect(approverLabel('Danielle Aguilar', false)).toBe('Danielle Aguilar');
  });

  it('appends "(you)" when the approver is the viewer', () => {
    expect(approverLabel('Danielle Aguilar', true)).toBe('Danielle Aguilar (you)');
  });

  it('renders an em dash for a null name (employee-side cells)', () => {
    expect(approverLabel(null, false)).toBe('—');
  });

  it('renders an em dash for an empty name even when isSelf', () => {
    expect(approverLabel('', true)).toBe('—');
  });
});
