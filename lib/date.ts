/** YYYY-MM-DD in the device's local timezone (toISOString() would use UTC). */
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday = 0 … Sunday = 6 */
export function mondayIndex(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}

/** Midnight on the Monday of the week containing `date`. */
export function getWeekStart(date: Date = new Date()): Date {
  return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -mondayIndex(date));
}
