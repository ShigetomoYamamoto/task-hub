// Relative date helpers for the mock layer.
// All values are derived from the current runtime date so the demo always
// looks "fresh" regardless of when it is opened.

const ISO_DATE_LENGTH = 10; // "YYYY-MM-DD"

/** Returns today's date as a local "YYYY-MM-DD" string. */
export function todayISO(): string {
  return toISODate(new Date());
}

/**
 * Returns a "YYYY-MM-DD" string offset from today by `n` days.
 * Negative values move into the past, positive into the future.
 */
export function daysFromToday(n: number): string {
  const base = new Date();
  const shifted = new Date(base.getFullYear(), base.getMonth(), base.getDate() + n);
  return toISODate(shifted);
}

/**
 * Returns a full ISO datetime string for a day offset from today at the
 * given hour/minute (local time). Useful for createdAt / lastSyncedAt values.
 */
export function isoAt(daysOffset: number, hh: number, mm: number): string {
  const base = new Date();
  const at = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + daysOffset,
    hh,
    mm,
    0,
    0
  );
  return at.toISOString();
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`.slice(0, ISO_DATE_LENGTH);
}
