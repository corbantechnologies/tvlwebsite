// Date helpers shared by reports (no database or Next.js imports, so tests can load them).
export { addDays } from "@/lib/dates";

/** Whole nights between two YYYY-MM-DD dates (0 if the second is not later). */
export function nightsBetween(a: string, b: string): number {
  const ms = Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z");
  return ms > 0 ? Math.round(ms / 86400000) : 0;
}
