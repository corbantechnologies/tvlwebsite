/** Today's date at the property (Mombasa, UTC+3) as YYYY-MM-DD. Safe for client and server. */
export function propertyToday(): string {
  return new Date(Date.now() + 3 * 3600 * 1000).toISOString().split("T")[0];
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

/** Check-in time at the property, used for the free-cancellation cut-off. */
export const CHECK_IN_HOUR_LOCAL = 14;

/** Milliseconds from now until check-in (2 pm Mombasa time on the check-in date). */
export function msUntilCheckIn(checkIn: string, now = Date.now()): number {
  const checkInUtc = Date.parse(`${checkIn}T${String(CHECK_IN_HOUR_LOCAL - 3).padStart(2, "0")}:00:00Z`);
  return checkInUtc - now;
}
