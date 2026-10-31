/** Today's date at the property (Mombasa, UTC+3) as YYYY-MM-DD. Safe for client and server. */
export function propertyToday(): string {
  return new Date(Date.now() + 3 * 3600 * 1000).toISOString().split("T")[0];
}
