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

/**
 * Time-only helpers for the correction / Add-Logs modals, where the DATE is
 * fixed (not user-editable) and only the time-of-day is entered. Same
 * browser-local interpretation as the datetime-local helpers above.
 */

/** ISO instant → local "HH:mm" for an `<input type="time">`. */
export function isoToTimeInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Combine a `YYYY-MM-DD` date and an `HH:mm` time into an ISO instant,
 * interpreting both in the browser-local zone. Used by Add Logs, where the
 * date is picked fresh (no prior instant to preserve).
 */
export function localDateTimeToIso(date: string, time: string): string {
  // `YYYY-MM-DDTHH:mm` (no zone) is parsed as LOCAL time by `Date`.
  return new Date(`${date}T${time}`).toISOString();
}

/**
 * Replace only the time-of-day of an existing ISO instant, keeping its local
 * calendar date. Used when correcting an existing entry so an unchanged
 * correction reproduces the original instant exactly (round-trip safe).
 */
export function replaceTimeOnIso(iso: string, time: string): string {
  const d = new Date(iso);
  const localDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return localDateTimeToIso(localDate, time);
}
