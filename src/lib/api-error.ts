import { ApiError } from '@/lib/api-client';

/**
 * Shape of the backend error envelope (`{ status, errors?, message? }`).
 * `errors` is a flat `field → message` map for 400 validation failures;
 * `message` is NestJS's single/array message string. These helpers parse it
 * once so drawers/forms don't each re-cast `err.body` and re-derive the same
 * "what should I show the user" logic.
 */
type ErrorEnvelope = {
  status?: number;
  errors?: Record<string, string>;
  message?: string | string[];
};

function envelope(err: unknown): ErrorEnvelope | null {
  if (err instanceof ApiError) return (err.body as ErrorEnvelope | null) ?? null;
  return null;
}

/** Field-level validation errors (`{ field: message }`), or `{}` when absent. */
export function fieldErrors(err: unknown): Record<string, string> {
  return envelope(err)?.errors ?? {};
}

/** The first field-level validation error, or `null` when there are none. */
export function firstFieldError(err: unknown): string | null {
  const errors = envelope(err)?.errors;
  if (!errors) return null;
  return Object.values(errors)[0] ?? null;
}

/**
 * The best human-readable message for an error: the first field error, then
 * the envelope `message` (a `string[]` is joined), then `fallback`. Use the
 * `fallback` to keep flow-specific copy ("Could not add the log.").
 */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const body = envelope(err);
  const first = body?.errors ? Object.values(body.errors)[0] : undefined;
  if (first) return first;
  if (Array.isArray(body?.message)) {
    const joined = body.message.join(', ');
    if (joined) return joined;
  } else if (typeof body?.message === 'string' && body.message) {
    return body.message;
  }
  return fallback;
}
