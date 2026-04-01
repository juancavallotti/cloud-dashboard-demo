/** Short label for a UTC calendar day `YYYY-MM-DD` (for chart axes). */
export function shortUtcDayLabel(isoDay: string): string {
  const [y, m, d] = isoDay.split("-").map(Number);
  if (!y || !m || !d) return isoDay;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
