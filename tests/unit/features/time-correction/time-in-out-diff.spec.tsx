import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimeDiff, TimeInOutDiff } from '@/features/time-correction/components/time-in-out-diff';

// Local-naive ISO (no Z) → formats back to the same wall-clock on any machine,
// since resolveDisplayTz() is runtime-local in test.
const iso = (t: string) => new Date(`2026-06-13T${t}`).toISOString();

describe('TimeDiff', () => {
  it('shows original → proposed when both are present', () => {
    const { container } = render(
      <TimeDiff original={iso('21:36:00')} proposed={iso('09:30:00')} />,
    );
    expect(container.textContent).toBe('21:36 → 09:30');
  });

  it('shows just the proposed time when there is no original (new log)', () => {
    const { container } = render(<TimeDiff original={null} proposed={iso('09:30:00')} />);
    expect(container.textContent).toBe('09:30');
  });

  it('shows just the original when there is no proposed', () => {
    const { container } = render(<TimeDiff original={iso('09:30:00')} proposed={null} />);
    expect(container.textContent).toBe('09:30');
  });

  it('renders the fallback when neither is present', () => {
    render(<TimeDiff original={null} proposed={null} fallback="—" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('TimeInOutDiff', () => {
  it('stacks in/out lines, each a diff', () => {
    const { container } = render(
      <TimeInOutDiff
        inOriginal={iso('21:36:00')}
        inProposed={iso('09:30:00')}
        outOriginal={iso('21:36:00')}
        outProposed={iso('21:36:00')}
      />,
    );
    expect(container.textContent).toContain('in:');
    expect(container.textContent).toContain('out:');
    expect(container.textContent).toMatch(/21:36 → 09:30/);
  });
});
