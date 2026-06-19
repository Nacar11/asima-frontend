import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormDrawer } from '@/components/form-drawer';

function renderDrawer(props: Partial<React.ComponentProps<typeof FormDrawer>> = {}) {
  return render(
    <FormDrawer
      open
      onClose={vi.fn()}
      title="Add employee"
      description="They can sign in after this."
      formId="test-form"
      onSubmit={vi.fn()}
      submitLabel="Create"
      pendingLabel="Creating…"
      submitting={false}
      {...props}
    >
      <input aria-label="name" />
    </FormDrawer>,
  );
}

describe('FormDrawer', () => {
  it('renders title, description, and children', () => {
    renderDrawer();
    expect(screen.getByText('Add employee')).toBeInTheDocument();
    expect(screen.getByText('They can sign in after this.')).toBeInTheDocument();
    expect(screen.getByLabelText('name')).toBeInTheDocument();
  });

  it('shows the submit label, and the pending label while submitting', () => {
    const { rerender } = renderDrawer({ submitting: false });
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    rerender(
      <FormDrawer
        open
        onClose={vi.fn()}
        title="Add employee"
        formId="test-form"
        onSubmit={vi.fn()}
        submitLabel="Create"
        pendingLabel="Creating…"
        submitting
      >
        <input aria-label="name" />
      </FormDrawer>,
    );
    expect(screen.getByRole('button', { name: 'Creating…' })).toBeInTheDocument();
  });

  it('wires the submit button to the form via formId', () => {
    renderDrawer();
    expect(screen.getByRole('button', { name: 'Create' })).toHaveAttribute('form', 'test-form');
  });

  it('disables the submit button when submitDisabled', () => {
    renderDrawer({ submitDisabled: true });
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('calls onClose from the Cancel button', async () => {
    const onClose = vi.fn();
    renderDrawer({ onClose });
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
