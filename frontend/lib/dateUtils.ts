/**
 * Date validation and parsing utilities
 * Single source of truth for date handling across the application
 */

export interface ParsedDate {
  year: number;
  month: number; // 1-12
  day: number;
}

export interface DateParseResult {
  success: boolean;
  data?: ParsedDate;
  error?: string;
}

export interface MonthParseResult {
  success: boolean;
  data?: { year: number; month: number }; // month is 0-indexed for JS Date
  error?: string;
}

/**
 * Parse a date string in YYYY-MM-DD format
 */
export function parseDate(dateStr: string): DateParseResult {
  if (!dateStr) {
    return { success: false, error: "Date string is required" };
  }

  const parts = dateStr.split("-");
  if (parts.length !== 3) {
    return { success: false, error: "Invalid date format. Expected YYYY-MM-DD" };
  }

  const [yearStr, monthStr, dayStr] = parts;
  const year = Number.parseInt(yearStr ?? "", 10);
  const month = Number.parseInt(monthStr ?? "", 10);
  const day = Number.parseInt(dayStr ?? "", 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return { success: false, error: "Invalid date format" };
  }

  if (month < 1 || month > 12) {
    return { success: false, error: "Month must be between 1 and 12" };
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return { success: false, error: `Day must be between 1 and ${daysInMonth}` };
  }

  return {
    success: true,
    data: { year, month, day },
  };
}

/**
 * Parse a month parameter in YYYY-MM or MM format
 */
export function parseMonth(monthParam: string | null | undefined): MonthParseResult {
  const today = new Date();
  const fallback = { month: today.getMonth(), year: today.getFullYear() };

  if (!monthParam) {
    return { success: true, data: fallback };
  }

  if (monthParam.includes("-")) {
    // Format: "YYYY-MM"
    const [yearStr, monthStr] = monthParam.split("-");
    if (!yearStr || !monthStr) {
      return { success: false, error: "Invalid month format. Expected YYYY-MM" };
    }

    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10) - 1; // Convert to 0-indexed

    if (!Number.isFinite(year) || Number.isNaN(month)) {
      return { success: false, error: "Invalid month format" };
    }

    // Clamp month to valid range
    const clampedMonth = Math.min(11, Math.max(0, month));
    return { success: true, data: { year, month: clampedMonth } };
  }

  // Format: "MM" - use current year
  const month = Number.parseInt(monthParam, 10) - 1; // Convert to 0-indexed
  if (Number.isNaN(month)) {
    return { success: false, error: "Invalid month format" };
  }

  const clampedMonth = Math.min(11, Math.max(0, month));
  return { success: true, data: { year: fallback.year, month: clampedMonth } };
}

/**
 * Create a Date object for the start of a given day (midnight local time)
 */
export function createDateAtMidnight(year: number, month: number, day: number): Date {
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get the start and end of a day for range queries
 */
export function getDayRange(year: number, month: number, day: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Get the start and end of a month for range queries
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Format a date as YYYY-MM-DD
 */
export function formatDateString(year: number, month: number, day: number): string {
  const monthStr = String(month).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  return `${year}-${monthStr}-${dayStr}`;
}

/**
 * Format a month as YYYY-MM
 */
export function formatMonthString(year: number, month: number): string {
  const monthStr = String(month).padStart(2, "0");
  return `${year}-${monthStr}`;
}

/**
 * Check if a given date is today
 */
export function isToday(year: number, month: number, day: number): boolean {
  const today = new Date();
  return (
    day === today.getDate() &&
    month - 1 === today.getMonth() &&
    year === today.getFullYear()
  );
}

/**
 * Get number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
 * Returns adjusted for Monday start (0 = Monday, 6 = Sunday)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  const firstDay = new Date(year, month - 1, 1).getDay();
  return firstDay === 0 ? 6 : firstDay - 1;
}
