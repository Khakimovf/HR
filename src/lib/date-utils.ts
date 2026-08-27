/**
 * UTC-Safe Date Utilities for HR Management System
 *
 * WHY THIS FILE EXISTS:
 *   Using `new Date(dateString)` + `.setHours(0,0,0,0)` sets midnight in the
 *   **server's local timezone**. For a server running at UTC+5 (Tashkent), a
 *   date like "2026-08-27" becomes "2026-08-26T19:00:00.000Z" in the DB — a
 *   silent 1-day shift that corrupts leave records and KPI calculations.
 *
 *   All date parsing in API routes MUST use these helpers instead of
 *   raw `new Date()` + `setHours` calls.
 */

/**
 * Parses a date string (YYYY-MM-DD or ISO) to UTC midnight (start of day).
 * "2026-08-27"  →  2026-08-27T00:00:00.000Z  ✅
 *
 * @param val - Raw date string from request body or query param
 * @returns Date at UTC 00:00:00.000 or null if invalid
 */
export function parseUTCDateStart(val: unknown): Date | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  // Prefer the YYYY-MM-DD form which JavaScript Date parses as UTC
  const dateOnly = trimmed.split('T')[0]; // strip any time portion
  const d = new Date(`${dateOnly}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parses a date string to UTC end-of-day (23:59:59.999Z).
 * "2026-08-27"  →  2026-08-27T23:59:59.999Z  ✅
 *
 * @param val - Raw date string from request body or query param
 * @returns Date at UTC 23:59:59.999 or null if invalid
 */
export function parseUTCDateEnd(val: unknown): Date | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  const dateOnly = trimmed.split('T')[0];
  const d = new Date(`${dateOnly}T23:59:59.999Z`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Generic safe UTC parse — keeps any time component if present,
 * otherwise treats as UTC midnight.
 * Use for timestamp fields like `transferDate`, `orderDate`, etc.
 *
 * @param val - Raw date or datetime string
 * @returns Parsed Date in UTC or null if invalid
 */
export function parseUTCDate(val: unknown): Date | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  // If the value has no time component, parse as UTC date-only
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T00:00:00.000Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  // Otherwise parse as-is (ISO with timezone offset is handled correctly)
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Calculates the inclusive number of calendar days between two UTC dates.
 * Both dates are normalised to UTC midnight before diff.
 *
 * Example: Aug 27 → Aug 29 = 3 days (27, 28, 29)
 *
 * @param start - UTC start date
 * @param end   - UTC end date
 * @returns Positive integer (minimum 1)
 */
export function calcDaysDiff(start: Date, end: Date): number {
  const startMs = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );
  const endMs = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate()
  );
  return Math.max(1, Math.round((endMs - startMs) / 86_400_000) + 1);
}

/**
 * Formats a Date to a "YYYY-MM-DD" string in UTC.
 * Safe for audit logs and comparisons.
 */
export function toUTCDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}
