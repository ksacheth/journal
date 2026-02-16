import { describe, test, expect } from "bun:test";
import {
  parseDate,
  parseMonth,
  createDateAtMidnight,
  getDayRange,
  getMonthRange,
  type ParsedDate,
  type DateParseResult,
  type MonthParseResult,
} from "./dateUtils";

describe("parseDate", () => {
  test("should parse valid date in YYYY-MM-DD format", () => {
    const result = parseDate("2024-03-15");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ year: 2024, month: 3, day: 15 });
    expect(result.error).toBeUndefined();
  });

  test("should parse date with leading zeros", () => {
    const result = parseDate("2024-01-05");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ year: 2024, month: 1, day: 5 });
  });

  test("should reject empty string", () => {
    const result = parseDate("");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Date string is required");
  });

  test("should reject invalid format without dashes", () => {
    const result = parseDate("20240315");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid date format. Expected YYYY-MM-DD");
  });

  test("should reject format with too few parts", () => {
    const result = parseDate("2024-03");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid date format. Expected YYYY-MM-DD");
  });

  test("should reject format with too many parts", () => {
    const result = parseDate("2024-03-15-12");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid date format. Expected YYYY-MM-DD");
  });

  test("should reject non-numeric year", () => {
    const result = parseDate("abcd-03-15");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid date format");
  });

  test("should reject non-numeric month", () => {
    const result = parseDate("2024-ab-15");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid date format");
  });

  test("should reject non-numeric day", () => {
    const result = parseDate("2024-03-ab");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid date format");
  });

  test("should reject month less than 1", () => {
    const result = parseDate("2024-00-15");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Month must be between 1 and 12");
  });

  test("should reject month greater than 12", () => {
    const result = parseDate("2024-13-15");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Month must be between 1 and 12");
  });

  test("should reject day less than 1", () => {
    const result = parseDate("2024-03-00");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Day must be between 1 and 31");
  });

  test("should reject day greater than days in month (30-day month)", () => {
    const result = parseDate("2024-04-31"); // April has 30 days
    expect(result.success).toBe(false);
    expect(result.error).toBe("Day must be between 1 and 30");
  });

  test("should reject day greater than days in month (31-day month)", () => {
    const result = parseDate("2024-03-32"); // March has 31 days
    expect(result.success).toBe(false);
    expect(result.error).toBe("Day must be between 1 and 31");
  });

  test("should reject invalid day for February in non-leap year", () => {
    const result = parseDate("2023-02-29"); // 2023 is not a leap year
    expect(result.success).toBe(false);
    expect(result.error).toBe("Day must be between 1 and 28");
  });

  test("should accept February 29 in leap year", () => {
    const result = parseDate("2024-02-29"); // 2024 is a leap year
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ year: 2024, month: 2, day: 29 });
  });

  test("should accept last day of month for each month", () => {
    const testCases = [
      { date: "2024-01-31", expected: { year: 2024, month: 1, day: 31 } },
      { date: "2024-02-29", expected: { year: 2024, month: 2, day: 29 } },
      { date: "2024-03-31", expected: { year: 2024, month: 3, day: 31 } },
      { date: "2024-04-30", expected: { year: 2024, month: 4, day: 30 } },
      { date: "2024-05-31", expected: { year: 2024, month: 5, day: 31 } },
      { date: "2024-06-30", expected: { year: 2024, month: 6, day: 30 } },
      { date: "2024-07-31", expected: { year: 2024, month: 7, day: 31 } },
      { date: "2024-08-31", expected: { year: 2024, month: 8, day: 31 } },
      { date: "2024-09-30", expected: { year: 2024, month: 9, day: 30 } },
      { date: "2024-10-31", expected: { year: 2024, month: 10, day: 31 } },
      { date: "2024-11-30", expected: { year: 2024, month: 11, day: 30 } },
      { date: "2024-12-31", expected: { year: 2024, month: 12, day: 31 } },
    ];

    for (const { date, expected } of testCases) {
      const result = parseDate(date);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expected);
    }
  });

  test("should handle very large years", () => {
    const result = parseDate("9999-12-31");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ year: 9999, month: 12, day: 31 });
  });

  test("should handle year 1900", () => {
    const result = parseDate("1900-01-01");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ year: 1900, month: 1, day: 1 });
  });

  test("should reject February 30", () => {
    const result = parseDate("2024-02-30");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Day must be between 1 and 29");
  });
});

describe("parseMonth", () => {
  test("should parse valid month in YYYY-MM format", () => {
    const result = parseMonth("2024-03");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ year: 2024, month: 3 });
    expect(result.error).toBeUndefined();
  });

  test("should parse month with leading zero", () => {
    const result = parseMonth("2024-01");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ year: 2024, month: 1 });
  });

  test("should parse month in MM format using current year", () => {
    const currentYear = new Date().getUTCFullYear();
    const result = parseMonth("03");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ year: currentYear, month: 3 });
  });

  test("should parse single digit month using current year", () => {
    const currentYear = new Date().getUTCFullYear();
    const result = parseMonth("3");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ year: currentYear, month: 3 });
  });

  test("should reject empty string", () => {
    const result = parseMonth("");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Month parameter is required");
  });

  test("should reject YYYY-MM format with invalid month > 12", () => {
    const result = parseMonth("2024-13");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Month must be between 1 and 12");
  });

  test("should reject YYYY-MM format with invalid month < 1", () => {
    const result = parseMonth("2024-00");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Month must be between 1 and 12");
  });

  test("should reject MM format with invalid month > 12", () => {
    const result = parseMonth("13");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid month format");
  });

  test("should reject MM format with invalid month < 1", () => {
    const result = parseMonth("0");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid month format");
  });

  test("should reject non-numeric year in YYYY-MM", () => {
    const result = parseMonth("abcd-03");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid month format");
  });

  test("should reject non-numeric month in YYYY-MM", () => {
    const result = parseMonth("2024-ab");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid month format");
  });

  test("should reject non-numeric month in MM format", () => {
    const result = parseMonth("ab");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid month format");
  });

  test("should reject YYYY-MM format with missing month", () => {
    const result = parseMonth("2024-");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid month format. Expected YYYY-MM");
  });

  test("should reject YYYY-MM format with missing year", () => {
    const result = parseMonth("-03");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid month format. Expected YYYY-MM");
  });

  test("should accept all valid months in YYYY-MM format", () => {
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, "0");
      const result = parseMonth(`2024-${monthStr}`);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ year: 2024, month });
    }
  });

  test("should accept all valid months in MM format", () => {
    const currentYear = new Date().getUTCFullYear();
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, "0");
      const result = parseMonth(monthStr);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ year: currentYear, month });
    }
  });
});

describe("createDateAtMidnight", () => {
  test("should create date at midnight UTC", () => {
    const date = createDateAtMidnight(2024, 3, 15);
    expect(date.getUTCFullYear()).toBe(2024);
    expect(date.getUTCMonth()).toBe(2); // 0-indexed
    expect(date.getUTCDate()).toBe(15);
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
    expect(date.getUTCMilliseconds()).toBe(0);
  });

  test("should create date for January 1st", () => {
    const date = createDateAtMidnight(2024, 1, 1);
    expect(date.getUTCFullYear()).toBe(2024);
    expect(date.getUTCMonth()).toBe(0);
    expect(date.getUTCDate()).toBe(1);
  });

  test("should create date for December 31st", () => {
    const date = createDateAtMidnight(2024, 12, 31);
    expect(date.getUTCFullYear()).toBe(2024);
    expect(date.getUTCMonth()).toBe(11);
    expect(date.getUTCDate()).toBe(31);
  });

  test("should create date for leap day", () => {
    const date = createDateAtMidnight(2024, 2, 29);
    expect(date.getUTCFullYear()).toBe(2024);
    expect(date.getUTCMonth()).toBe(1);
    expect(date.getUTCDate()).toBe(29);
  });

  test("should always be midnight regardless of local timezone", () => {
    const date = createDateAtMidnight(2024, 6, 15);
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
    expect(date.getUTCMilliseconds()).toBe(0);
  });
});

describe("getDayRange", () => {
  test("should return start and end of day in UTC", () => {
    const { start, end } = getDayRange(2024, 3, 15);

    expect(start.getUTCFullYear()).toBe(2024);
    expect(start.getUTCMonth()).toBe(2);
    expect(start.getUTCDate()).toBe(15);
    expect(start.getUTCHours()).toBe(0);
    expect(start.getUTCMinutes()).toBe(0);
    expect(start.getUTCSeconds()).toBe(0);
    expect(start.getUTCMilliseconds()).toBe(0);

    expect(end.getUTCFullYear()).toBe(2024);
    expect(end.getUTCMonth()).toBe(2);
    expect(end.getUTCDate()).toBe(15);
    expect(end.getUTCHours()).toBe(23);
    expect(end.getUTCMinutes()).toBe(59);
    expect(end.getUTCSeconds()).toBe(59);
    expect(end.getUTCMilliseconds()).toBe(999);
  });

  test("should handle first day of year", () => {
    const { start, end } = getDayRange(2024, 1, 1);

    expect(start.getUTCMonth()).toBe(0);
    expect(start.getUTCDate()).toBe(1);
    expect(end.getUTCMonth()).toBe(0);
    expect(end.getUTCDate()).toBe(1);
  });

  test("should handle last day of year", () => {
    const { start, end } = getDayRange(2024, 12, 31);

    expect(start.getUTCMonth()).toBe(11);
    expect(start.getUTCDate()).toBe(31);
    expect(end.getUTCMonth()).toBe(11);
    expect(end.getUTCDate()).toBe(31);
  });

  test("should handle leap day", () => {
    const { start, end } = getDayRange(2024, 2, 29);

    expect(start.getUTCMonth()).toBe(1);
    expect(start.getUTCDate()).toBe(29);
    expect(end.getUTCMonth()).toBe(1);
    expect(end.getUTCDate()).toBe(29);
  });

  test("should have end time exactly 86399999ms after start", () => {
    const { start, end } = getDayRange(2024, 3, 15);
    const diff = end.getTime() - start.getTime();
    expect(diff).toBe(86399999); // 24 hours - 1ms
  });
});

describe("getMonthRange", () => {
  test("should return start and end of month in UTC", () => {
    const { start, end } = getMonthRange(2024, 3);

    expect(start.getUTCFullYear()).toBe(2024);
    expect(start.getUTCMonth()).toBe(2);
    expect(start.getUTCDate()).toBe(1);
    expect(start.getUTCHours()).toBe(0);
    expect(start.getUTCMinutes()).toBe(0);
    expect(start.getUTCSeconds()).toBe(0);
    expect(start.getUTCMilliseconds()).toBe(0);

    expect(end.getUTCFullYear()).toBe(2024);
    expect(end.getUTCMonth()).toBe(2);
    expect(end.getUTCDate()).toBe(31); // March has 31 days
    expect(end.getUTCHours()).toBe(23);
    expect(end.getUTCMinutes()).toBe(59);
    expect(end.getUTCSeconds()).toBe(59);
    expect(end.getUTCMilliseconds()).toBe(999);
  });

  test("should handle January", () => {
    const { start, end } = getMonthRange(2024, 1);

    expect(start.getUTCDate()).toBe(1);
    expect(start.getUTCMonth()).toBe(0);
    expect(end.getUTCDate()).toBe(31);
    expect(end.getUTCMonth()).toBe(0);
  });

  test("should handle December", () => {
    const { start, end } = getMonthRange(2024, 12);

    expect(start.getUTCDate()).toBe(1);
    expect(start.getUTCMonth()).toBe(11);
    expect(end.getUTCDate()).toBe(31);
    expect(end.getUTCMonth()).toBe(11);
  });

  test("should handle February in leap year", () => {
    const { start, end } = getMonthRange(2024, 2);

    expect(start.getUTCDate()).toBe(1);
    expect(start.getUTCMonth()).toBe(1);
    expect(end.getUTCDate()).toBe(29); // Leap year
    expect(end.getUTCMonth()).toBe(1);
  });

  test("should handle February in non-leap year", () => {
    const { start, end } = getMonthRange(2023, 2);

    expect(start.getUTCDate()).toBe(1);
    expect(start.getUTCMonth()).toBe(1);
    expect(end.getUTCDate()).toBe(28); // Non-leap year
    expect(end.getUTCMonth()).toBe(1);
  });

  test("should handle 30-day months", () => {
    const months30Days = [4, 6, 9, 11]; // April, June, September, November

    for (const month of months30Days) {
      const { start, end } = getMonthRange(2024, month);
      expect(start.getUTCDate()).toBe(1);
      expect(end.getUTCDate()).toBe(30);
    }
  });

  test("should handle 31-day months", () => {
    const months31Days = [1, 3, 5, 7, 8, 10, 12]; // Jan, Mar, May, Jul, Aug, Oct, Dec

    for (const month of months31Days) {
      const { start, end } = getMonthRange(2024, month);
      expect(start.getUTCDate()).toBe(1);
      expect(end.getUTCDate()).toBe(31);
    }
  });

  test("should handle year 2000 (leap year)", () => {
    const { start, end } = getMonthRange(2000, 2);
    expect(end.getUTCDate()).toBe(29);
  });

  test("should handle year 1900 (not a leap year)", () => {
    const { start, end } = getMonthRange(1900, 2);
    expect(end.getUTCDate()).toBe(28);
  });
});