/**
 * Display label for an approver in a status/approval-chain line. Appends a
 * "(you)" marker when the approver is the viewing user, so a request shows e.g.
 * `Danielle Aguilar (you)` when you're the one who must act. A missing name
 * (the employee-side read-models allow `null`) renders an em dash.
 *
 * `isSelf` is decided by the caller (`approverId === useAuth().user.id`) — this
 * helper stays pure so it's trivially unit-testable and feature-agnostic.
 */
export function approverLabel(name: string | null | undefined, isSelf: boolean): string {
  if (!name) return '—';
  return isSelf ? `${name} (you)` : name;
}
