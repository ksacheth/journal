/**
 * Date validation and parsing utilities for the backend
 * Single source of truth for date handling
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
  data?: { year: number; month: number }; // month is 1-12
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
export function parseMonth(monthParam: string): MonthParseResult {
  if (!monthParam) {
    return { success: false, error: "Month parameter is required" };
  }

  if (monthParam.includes("-")) {
    // Format: "YYYY-MM"
    const parts = monthParam.split("-");
    const [yearStr, monthStr] = parts;
    
    if (!yearStr || !monthStr) {
      return { success: false, error: "Invalid month format. Expected YYYY-MM" };
    }

    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);

    if (Number.isNaN(year) || Number.isNaN(month)) {
      return { success: false, error: "Invalid month format" };
    }

    if (month < 1 || month > 12) {
      return { success: false, error: "Month must be between 1 and 12" };
    }

    return { success: true, data: { year, month } };
  }

  // Format: "MM" - use current year
  const month = Number.parseInt(monthParam, 10);
  if (Number.isNaN(month) || month < 1 || month > 12) {
    return { success: false, error: "Invalid month format" };
  }

  const year = new Date().getFullYear();
  return { success: true, data: { year, month } };
}

/**
 * Create a Date object for the start of a given day (midnight UTC)
 * Uses UTC to ensure consistent date storage in MongoDB regardless of server timezone
 */
export function createDateAtMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Get the start and end of a day for range queries (UTC)
 * Uses UTC dates to match MongoDB's storage format
 */
export function getDayRange(year: number, month: number, day: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  return { start, end };
}

/**
 * Get the start and end of a month for range queries (UTC)
 * Uses UTC dates to match MongoDB's storage format
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}
