/**
 * Generates an X-Request-ID for outbound API calls. The backend echoes
 * it back in its response header, and logs are tagged with the same id —
 * so a single id correlates a click in the browser with the server-side
 * stack trace. See `asima-backend` RequestIdMiddleware.
 *
 * Uses native crypto.randomUUID() where available (modern browsers,
 * Node ≥ 19), falls back to a Math.random hex string for very old runtimes.
 * Either is sufficient for log correlation — neither is used as a
 * security token.
 */
export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, '0'),
  ).join('-');
}
