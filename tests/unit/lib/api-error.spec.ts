import { describe, it, expect } from 'vitest';
import { ApiError } from '@/lib/api-client';
import { fieldErrors, firstFieldError, errorMessage } from '@/lib/api-error';

const withBody = (body: unknown, status = 400) => new ApiError(status, body);

describe('fieldErrors', () => {
  it('returns the errors record when present', () => {
    const err = withBody({ errors: { email: 'Already taken', name: 'Required' } });
    expect(fieldErrors(err)).toEqual({ email: 'Already taken', name: 'Required' });
  });

  it('returns an empty object when there are no field errors', () => {
    expect(fieldErrors(withBody({ message: 'nope' }))).toEqual({});
  });

  it('returns an empty object for a non-ApiError', () => {
    expect(fieldErrors(new Error('boom'))).toEqual({});
    expect(fieldErrors(null)).toEqual({});
  });
});

describe('firstFieldError', () => {
  it('returns the first field error message', () => {
    const err = withBody({ errors: { email: 'Already taken', name: 'Required' } });
    expect(firstFieldError(err)).toBe('Already taken');
  });

  it('returns null when there are no field errors', () => {
    expect(firstFieldError(withBody({ message: 'just a message' }))).toBeNull();
  });

  it('returns null for a non-ApiError', () => {
    expect(firstFieldError(new Error('boom'))).toBeNull();
  });
});

describe('errorMessage', () => {
  it('prefers the first field error over the message', () => {
    const err = withBody({ errors: { email: 'Already taken' }, message: 'Validation failed' });
    expect(errorMessage(err)).toBe('Already taken');
  });

  it('returns a string message', () => {
    expect(errorMessage(withBody({ message: 'Dates are not allowed.' }))).toBe(
      'Dates are not allowed.',
    );
  });

  it('joins a string[] message', () => {
    expect(errorMessage(withBody({ message: ['too early', 'too late'] }))).toBe(
      'too early, too late',
    );
  });

  it('falls back to the default for a non-ApiError', () => {
    expect(errorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });

  it('falls back when the body has no usable fields', () => {
    expect(errorMessage(withBody({ status: 400 }))).toBe('Something went wrong. Please try again.');
  });

  it('respects a custom fallback', () => {
    expect(errorMessage(new Error('boom'), 'Could not add the log.')).toBe(
      'Could not add the log.',
    );
  });
});
