import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Field } from '@/components/form/field';

describe('Field', () => {
  it('renders the label and children', () => {
    render(
      <Field label="Email">
        <input aria-label="email-input" />
      </Field>,
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('email-input')).toBeInTheDocument();
  });

  it('renders the error text when provided', () => {
    render(
      <Field label="Email" error="Already taken">
        <input />
      </Field>,
    );
    expect(screen.getByText('Already taken')).toBeInTheDocument();
  });

  it('omits error text when no error', () => {
    render(
      <Field label="Email">
        <input />
      </Field>,
    );
    expect(screen.queryByText('Already taken')).not.toBeInTheDocument();
  });

  it('renders helper text when there is no error', () => {
    render(
      <Field label="New password" helper="At least 8 characters.">
        <input />
      </Field>,
    );
    expect(screen.getByText('At least 8 characters.')).toBeInTheDocument();
  });

  it('hides helper text when an error is present', () => {
    render(
      <Field label="New password" helper="At least 8 characters." error="Too short">
        <input />
      </Field>,
    );
    expect(screen.queryByText('At least 8 characters.')).not.toBeInTheDocument();
    expect(screen.getByText('Too short')).toBeInTheDocument();
  });

  it('associates the label with the control via htmlFor', () => {
    render(
      <Field label="Email" htmlFor="email">
        <input id="email" />
      </Field>,
    );
    // getByLabelText resolves the for/id association
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });
});
