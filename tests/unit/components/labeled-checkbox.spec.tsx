import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { LabeledCheckbox } from '@/components/labeled-checkbox';

/**
 * Tiny RHF harness — lets each test drive the wrapper with real form
 * state and read back what `field.onChange` produced.
 */
function Harness({
  defaultChecked = false,
  disabled = false,
  description,
}: {
  defaultChecked?: boolean;
  disabled?: boolean;
  description?: string;
}) {
  const form = useForm<{ is_active: boolean }>({
    defaultValues: { is_active: defaultChecked },
  });
  return (
    <form>
      <LabeledCheckbox
        control={form.control}
        name="is_active"
        label="Active"
        description={description}
        disabled={disabled}
      />
      {/* Surface the form value so assertions can read it. */}
      <output data-testid="value">{String(form.watch('is_active'))}</output>
    </form>
  );
}

describe('LabeledCheckbox', () => {
  it('renders unchecked by default and surfaces the label', () => {
    render(<Harness />);
    const checkbox = screen.getByRole('checkbox', { name: 'Active' });
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    expect(screen.getByTestId('value').textContent).toBe('false');
  });

  it('starts checked when the form default is true', () => {
    render(<Harness defaultChecked />);
    const checkbox = screen.getByRole('checkbox', { name: 'Active' });
    expect(checkbox).toHaveAttribute('data-state', 'checked');
    expect(screen.getByTestId('value').textContent).toBe('true');
  });

  it('toggles when the checkbox itself is clicked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const checkbox = screen.getByRole('checkbox', { name: 'Active' });
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('data-state', 'checked');
    expect(screen.getByTestId('value').textContent).toBe('true');
  });

  it('toggles when the label text is clicked (htmlFor wiring)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText('Active'));
    expect(screen.getByRole('checkbox', { name: 'Active' })).toHaveAttribute(
      'data-state',
      'checked',
    );
  });

  it('toggles with the Space key when focused', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const checkbox = screen.getByRole('checkbox', { name: 'Active' });
    checkbox.focus();
    await user.keyboard(' ');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('does NOT toggle when disabled', async () => {
    const user = userEvent.setup();
    render(<Harness disabled />);
    const checkbox = screen.getByRole('checkbox', { name: 'Active' });
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    expect(screen.getByTestId('value').textContent).toBe('false');
  });

  it('associates the description via aria-describedby when provided', () => {
    render(<Harness description="Inactive employees can't sign in." />);
    const checkbox = screen.getByRole('checkbox', { name: 'Active' });
    const describedBy = checkbox.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe(
      "Inactive employees can't sign in.",
    );
  });
});
