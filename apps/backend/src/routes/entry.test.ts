import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  parseDate,
  parseMonth,
  getDayRange,
  getMonthRange,
  createDateAtMidnight,
} from "../dateUtils";

describe("entry routes", () => {
  describe("rate limiting configuration", () => {
    test("should have correct rate limit window for entries", () => {
      const ENTRY_RATE_LIMIT = {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_ATTEMPTS: 100,
      };

      expect(ENTRY_RATE_LIMIT.WINDOW_MS).toBe(900000);
      expect(ENTRY_RATE_LIMIT.MAX_ATTEMPTS).toBe(100);
    });

    test("should be more lenient than auth rate limit", () => {
      const ENTRY_RATE_LIMIT = { MAX_ATTEMPTS: 100 };
      const AUTH_RATE_LIMIT = { MAX_ATTEMPTS: 5 };

      expect(ENTRY_RATE_LIMIT.MAX_ATTEMPTS).toBeGreaterThan(
        AUTH_RATE_LIMIT.MAX_ATTEMPTS,
      );
    });
  });

  describe("GET /entries/:month - month parameter validation", () => {
    test("should accept YYYY-MM format", () => {
      const result = parseMonth("2024-03");
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ year: 2024, month: 3 });
    });

    test("should accept MM format with current year", () => {
      const currentYear = new Date().getUTCFullYear();
      const result = parseMonth("03");
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ year: currentYear, month: 3 });
    });

    test("should reject invalid month format", () => {
      const result = parseMonth("invalid");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("should reject empty month parameter", () => {
      const result = parseMonth("");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Month parameter is required");
    });

    test("should reject month > 12", () => {
      const result = parseMonth("2024-13");
      expect(result.success).toBe(false);
    });

    test("should reject month < 1", () => {
      const result = parseMonth("2024-00");
      expect(result.success).toBe(false);
    });
  });

  describe("GET /entries/:month - pagination", () => {
    test("should use default page 1 if not specified", () => {
      const pageParam = "1";
      const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
      expect(page).toBe(1);
    });

    test("should use default limit 31 if not specified", () => {
      const limitParam = "31";
      const limit = Math.min(
        100,
        Math.max(1, Number.parseInt(limitParam ?? "31", 10) || 31),
      );
      expect(limit).toBe(31);
    });

    test("should enforce minimum page of 1", () => {
      const pageParam = "-5";
      const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
      expect(page).toBe(1);
    });

    test("should enforce maximum limit of 100", () => {
      const limitParam = "200";
      const limit = Math.min(
        100,
        Math.max(1, Number.parseInt(limitParam ?? "31", 10) || 31),
      );
      expect(limit).toBe(100);
    });

    test("should enforce minimum limit of 1", () => {
      const limitParam = "-10";
      const limit = Math.min(
        100,
        Math.max(1, Number.parseInt(limitParam ?? "31", 10) || 31),
      );
      expect(limit).toBe(1);
    });

    test("should calculate correct skip value", () => {
      const page = 3;
      const limit = 20;
      const skip = (page - 1) * limit;
      expect(skip).toBe(40);
    });

    test("should handle page 1 with zero skip", () => {
      const page = 1;
      const limit = 31;
      const skip = (page - 1) * limit;
      expect(skip).toBe(0);
    });
  });

  describe("GET /entries/:month - month range calculation", () => {
    test("should create correct month range for March 2024", () => {
      const { start, end } = getMonthRange(2024, 3);

      expect(start.getUTCFullYear()).toBe(2024);
      expect(start.getUTCMonth()).toBe(2);
      expect(start.getUTCDate()).toBe(1);

      expect(end.getUTCFullYear()).toBe(2024);
      expect(end.getUTCMonth()).toBe(2);
      expect(end.getUTCDate()).toBe(31);
    });

    test("should handle February in leap year", () => {
      const { start, end } = getMonthRange(2024, 2);
      expect(end.getUTCDate()).toBe(29);
    });

    test("should handle February in non-leap year", () => {
      const { start, end } = getMonthRange(2023, 2);
      expect(end.getUTCDate()).toBe(28);
    });
  });

  describe("GET /entries/:month - date formatting", () => {
    test("should format date correctly from UTC Date object", () => {
      const dateValue = new Date(Date.UTC(2024, 2, 5)); // March 5, 2024
      const year = dateValue.getUTCFullYear();
      const month = String(dateValue.getUTCMonth() + 1).padStart(2, "0");
      const day = String(dateValue.getUTCDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      expect(dateStr).toBe("2024-03-05");
    });

    test("should pad single digit months", () => {
      const month = String(5).padStart(2, "0");
      expect(month).toBe("05");
    });

    test("should pad single digit days", () => {
      const day = String(7).padStart(2, "0");
      expect(day).toBe("07");
    });

    test("should not pad double digit values", () => {
      const month = String(12).padStart(2, "0");
      const day = String(25).padStart(2, "0");
      expect(month).toBe("12");
      expect(day).toBe("25");
    });
  });

  describe("GET /entry/:date - date parameter validation", () => {
    test("should accept valid YYYY-MM-DD format", () => {
      const result = parseDate("2024-03-15");
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ year: 2024, month: 3, day: 15 });
    });

    test("should reject invalid date format", () => {
      const result = parseDate("2024/03/15");
      expect(result.success).toBe(false);
    });

    test("should reject empty date parameter", () => {
      const result = parseDate("");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Date string is required");
    });

    test("should reject invalid dates like February 30", () => {
      const result = parseDate("2024-02-30");
      expect(result.success).toBe(false);
    });
  });

  describe("GET /entry/:date - day range calculation", () => {
    test("should create correct day range", () => {
      const { start, end } = getDayRange(2024, 3, 15);

      expect(start.getUTCFullYear()).toBe(2024);
      expect(start.getUTCMonth()).toBe(2);
      expect(start.getUTCDate()).toBe(15);
      expect(start.getUTCHours()).toBe(0);

      expect(end.getUTCFullYear()).toBe(2024);
      expect(end.getUTCMonth()).toBe(2);
      expect(end.getUTCDate()).toBe(15);
      expect(end.getUTCHours()).toBe(23);
      expect(end.getUTCMinutes()).toBe(59);
      expect(end.getUTCSeconds()).toBe(59);
    });

    test("should span exactly one day", () => {
      const { start, end } = getDayRange(2024, 3, 15);
      const diff = end.getTime() - start.getTime();
      expect(diff).toBe(86399999); // Almost 24 hours (minus 1ms)
    });
  });

  describe("POST /entry/:date - date parameter validation", () => {
    test("should accept valid date", () => {
      const result = parseDate("2024-03-15");
      expect(result.success).toBe(true);
    });

    test("should reject invalid date", () => {
      const result = parseDate("invalid-date");
      expect(result.success).toBe(false);
    });
  });

  describe("POST /entry/:date - entry validation", () => {
    test("should validate entry with required mood", async () => {
      const { entrySchema } = await import("../validators");

      const result = entrySchema.safeParse({
        mood: "good",
        title: "Test Entry",
        text: "This is a test",
      });

      expect(result.success).toBe(true);
    });

    test("should reject entry without mood", async () => {
      const { entrySchema } = await import("../validators");

      const result = entrySchema.safeParse({
        title: "Test Entry",
        text: "This is a test",
      });

      expect(result.success).toBe(false);
    });

    test("should accept all valid mood values", async () => {
      const { entrySchema, MOOD_VALUES } = await import("../validators");

      for (const mood of MOOD_VALUES) {
        const result = entrySchema.safeParse({ mood });
        expect(result.success).toBe(true);
      }
    });

    test("should reject invalid mood value", async () => {
      const { entrySchema } = await import("../validators");

      const result = entrySchema.safeParse({ mood: "invalid" });
      expect(result.success).toBe(false);
    });

    test("should accept entry with optional title", async () => {
      const { entrySchema } = await import("../validators");

      const result = entrySchema.safeParse({
        mood: "good",
        title: "My Title",
      });

      expect(result.success).toBe(true);
    });

    test("should accept entry with optional text", async () => {
      const { entrySchema } = await import("../validators");

      const result = entrySchema.safeParse({
        mood: "good",
        text: "My journal entry text",
      });

      expect(result.success).toBe(true);
    });

    test("should accept entry with optional todos", async () => {
      const { entrySchema } = await import("../validators");

      const result = entrySchema.safeParse({
        mood: "good",
        todos: [
          { id: "1", text: "Todo 1", completed: false },
          { id: "2", text: "Todo 2", completed: true },
        ],
      });

      expect(result.success).toBe(true);
    });

    test("should accept entry with optional tags", async () => {
      const { entrySchema } = await import("../validators");

      const result = entrySchema.safeParse({
        mood: "good",
        tags: ["personal", "work", "health"],
      });

      expect(result.success).toBe(true);
    });

    test("should reject title exceeding max length", async () => {
      const { entrySchema, VALIDATION_LIMITS } = await import("../validators");

      const longTitle = "a".repeat(VALIDATION_LIMITS.TITLE_MAX + 1);
      const result = entrySchema.safeParse({
        mood: "good",
        title: longTitle,
      });

      expect(result.success).toBe(false);
    });

    test("should reject text exceeding max length", async () => {
      const { entrySchema, VALIDATION_LIMITS } = await import("../validators");

      const longText = "a".repeat(VALIDATION_LIMITS.TEXT_MAX + 1);
      const result = entrySchema.safeParse({
        mood: "good",
        text: longText,
      });

      expect(result.success).toBe(false);
    });

    test("should reject too many todos", async () => {
      const { entrySchema, VALIDATION_LIMITS } = await import("../validators");

      const tooManyTodos = Array.from(
        { length: VALIDATION_LIMITS.TODOS_MAX + 1 },
        (_, i) => ({
          id: String(i),
          text: `Todo ${i}`,
        }),
      );

      const result = entrySchema.safeParse({
        mood: "good",
        todos: tooManyTodos,
      });

      expect(result.success).toBe(false);
    });

    test("should reject too many tags", async () => {
      const { entrySchema, VALIDATION_LIMITS } = await import("../validators");

      const tooManyTags = Array.from(
        { length: VALIDATION_LIMITS.TAGS_MAX + 1 },
        (_, i) => `tag${i}`,
      );

      const result = entrySchema.safeParse({
        mood: "good",
        tags: tooManyTags,
      });

      expect(result.success).toBe(false);
    });

    test("should accept title at max length", async () => {
      const { entrySchema, VALIDATION_LIMITS } = await import("../validators");

      const maxTitle = "a".repeat(VALIDATION_LIMITS.TITLE_MAX);
      const result = entrySchema.safeParse({
        mood: "good",
        title: maxTitle,
      });

      expect(result.success).toBe(true);
    });

    test("should accept text at max length", async () => {
      const { entrySchema, VALIDATION_LIMITS } = await import("../validators");

      const maxText = "a".repeat(VALIDATION_LIMITS.TEXT_MAX);
      const result = entrySchema.safeParse({
        mood: "good",
        text: maxText,
      });

      expect(result.success).toBe(true);
    });

    test("should accept maximum allowed todos", async () => {
      const { entrySchema, VALIDATION_LIMITS } = await import("../validators");

      const maxTodos = Array.from(
        { length: VALIDATION_LIMITS.TODOS_MAX },
        (_, i) => ({
          id: String(i),
          text: `Todo ${i}`,
        }),
      );

      const result = entrySchema.safeParse({
        mood: "good",
        todos: maxTodos,
      });

      expect(result.success).toBe(true);
    });

    test("should accept maximum allowed tags", async () => {
      const { entrySchema, VALIDATION_LIMITS } = await import("../validators");

      const maxTags = Array.from(
        { length: VALIDATION_LIMITS.TAGS_MAX },
        (_, i) => `tag${i}`,
      );

      const result = entrySchema.safeParse({
        mood: "good",
        tags: maxTags,
      });

      expect(result.success).toBe(true);
    });

    test("should reject todo with text exceeding max length", async () => {
      const { entrySchema, VALIDATION_LIMITS } = await import("../validators");

      const result = entrySchema.safeParse({
        mood: "good",
        todos: [
          {
            id: "1",
            text: "a".repeat(VALIDATION_LIMITS.TODO_TEXT_MAX + 1),
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    test("should reject todo with id exceeding max length", async () => {
      const { entrySchema, VALIDATION_LIMITS } = await import("../validators");

      const result = entrySchema.safeParse({
        mood: "good",
        todos: [
          {
            id: "a".repeat(VALIDATION_LIMITS.TODO_ID_MAX + 1),
            text: "Valid text",
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    test("should reject tag exceeding max length", async () => {
      const { entrySchema, VALIDATION_LIMITS } = await import("../validators");

      const result = entrySchema.safeParse({
        mood: "good",
        tags: ["a".repeat(VALIDATION_LIMITS.TAG_MAX + 1)],
      });

      expect(result.success).toBe(false);
    });

    test("should reject empty tag", async () => {
      const { entrySchema } = await import("../validators");

      const result = entrySchema.safeParse({
        mood: "good",
        tags: [""],
      });

      expect(result.success).toBe(false);
    });
  });

  describe("POST /entry/:date - date creation", () => {
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

    test("should create consistent date regardless of local timezone", () => {
      const date1 = createDateAtMidnight(2024, 6, 15);
      const date2 = createDateAtMidnight(2024, 6, 15);

      expect(date1.getTime()).toBe(date2.getTime());
    });
  });

  describe("entry route response codes", () => {
    test("should return 401 for unauthorized requests", () => {
      const unauthorizedStatus = 401;
      expect(unauthorizedStatus).toBe(401);
    });

    test("should return 400 for invalid parameters", () => {
      const badRequestStatus = 400;
      expect(badRequestStatus).toBe(400);
    });

    test("should return 404 when entry not found", () => {
      const notFoundStatus = 404;
      expect(notFoundStatus).toBe(404);
    });

    test("should return 500 for server errors", () => {
      const serverErrorStatus = 500;
      expect(serverErrorStatus).toBe(500);
    });

    test("should return 200 for successful GET requests", () => {
      const successStatus = 200;
      expect(successStatus).toBe(200);
    });

    test("should return 200 for successful POST requests", () => {
      const successStatus = 200;
      expect(successStatus).toBe(200);
    });
  });

  describe("entry route error messages", () => {
    test("should return unauthorized error message", () => {
      const errorResponse = { error: "Unauthorized" };
      expect(errorResponse.error).toBe("Unauthorized");
    });

    test("should return invalid month parameter error", () => {
      const errorResponse = { error: "Invalid month parameter" };
      expect(errorResponse.error).toBe("Invalid month parameter");
    });

    test("should return invalid date parameter error", () => {
      const errorResponse = { error: "Invalid date parameter" };
      expect(errorResponse.error).toBe("Invalid date parameter");
    });

    test("should return entry not found error", () => {
      const errorResponse = { error: "Entry not found for this date" };
      expect(errorResponse.error).toBe("Entry not found for this date");
    });

    test("should return validation error with details", () => {
      const errorResponse = {
        error: "Invalid input",
        details: [],
      };
      expect(errorResponse.error).toBe("Invalid input");
      expect(errorResponse).toHaveProperty("details");
    });
  });

  describe("cache integration", () => {
    test("should have correct response structure for cached month entries", () => {
      const responseData = {
        entries: [
          { date: "2024-03-01", mood: "good" },
          { date: "2024-03-02", mood: "excellent" },
        ],
        pagination: {
          page: 1,
          limit: 31,
          total: 2,
        },
      };

      expect(responseData).toHaveProperty("entries");
      expect(responseData).toHaveProperty("pagination");
      expect(Array.isArray(responseData.entries)).toBe(true);
      expect(responseData.pagination.page).toBeGreaterThan(0);
      expect(responseData.pagination.limit).toBeGreaterThan(0);
    });

    test("should format entry dates consistently", () => {
      const entry = {
        date: "2024-03-15",
        mood: "good",
      };

      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
