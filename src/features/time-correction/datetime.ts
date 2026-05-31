/**
 * Helpers bridging ISO timestamps and `<input type="datetime-local">`
 * values ("YYYY-MM-DDTHH:mm"). Both directions use the browser-local
 * interpretation so a value round-trips cleanly. The app's display tz
 * policy (lib/tz) is a v1 follow-up for these inputs — see the timesheet
 * note in the 2026-05-30 plan §6 ("upgrade once we have a real design
 * need").
 */
const pad = (n: number) => String(n).padStart(2, '0');

export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function localInputToIso(local: string): string {
  return new Date(local).toISOString();
}
