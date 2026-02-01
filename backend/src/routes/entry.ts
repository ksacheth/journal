import express from "express";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import { EntryModel } from "../models/Entry";
import { authHandle } from "../middleware/auth";
import { entrySchema } from "../validators";
import { logger } from "../config";
import { cache } from "../cache";
import { parseDate, parseMonth, getDayRange, getMonthRange, createDateAtMidnight } from "../dateUtils";

const router = express.Router();

// Initialize DOMPurify with jsdom for server-side sanitization
const window = new JSDOM("").window;
const purify = DOMPurify(window);

/**
 * Sanitize user input to prevent XSS attacks
 * Uses DOMPurify to robustly parse and sanitize HTML input
 * Removes all HTML tags and returns plain text content
 */
function sanitizeInput(input: string | undefined): string | undefined {
  if (!input) return undefined;
  
  // Use DOMPurify to sanitize HTML
  // This handles malformed/unclosed tags properly
  // ALLOWED_TAGS: [] means no HTML tags are allowed - treated as plain text
  const sanitized = purify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  return sanitized;
}

router.get("/entries/:month", authHandle, async (req, res) => {
  try {
    const monthParam = req.params.month as string;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!monthParam) {
      return res.status(400).json({ error: "Invalid month parameter" });
    }

    // Parse month parameter using shared utility
    const monthResult = parseMonth(monthParam);
    if (!monthResult.success || !monthResult.data) {
      return res.status(400).json({ error: monthResult.error ?? "Invalid month format" });
    }

    const { year, month: monthNum } = monthResult.data;

    const pageParam = (req.query.page as string) || "1";
    const limitParam = (req.query.limit as string) || "31";
    const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(limitParam ?? "31", 10) || 31),
    );
    const skip = (page - 1) * limit;

    // Check cache first
    const cachedData = await cache.getCachedMonthEntries<{
      entries: Array<{ date: Date; mood: string }>;
      pagination: { page: number; limit: number; total: number };
    }>(userId, year, monthNum, page, limit);

    if (cachedData) {
      logger.debug(
        { userId, year, month: monthNum, page, limit },
        "Cache hit for monthly entries",
      );
      return res.json(cachedData);
    }

    // Create date range for the month using shared utility
    const { start: startDate, end: endDate } = getMonthRange(year, monthNum);

    const [entries, total] = await Promise.all([
      EntryModel.find({
        userId: userId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .select("date mood -_id")
        .lean(), // Use lean() for better performance
      EntryModel.countDocuments({
        userId: userId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      }),
    ]);

    const responseData = {
      entries: entries.map((entry) => ({
        date: entry.date,
        mood: entry.mood,
      })),
      pagination: {
        page,
        limit,
        total,
      },
    };

    // Cache the result
    await cache.cacheMonthEntries(userId, year, monthNum, page, limit, responseData);

    return res.json(responseData);
  } catch (error) {
    logger.error(
      { err: error, userId: req.userId, month: req.params.month },
      "Error fetching entries",
    );
    return res.status(500).json({ error: "Error fetching entries" });
  }
});

router.get("/entry/:date", authHandle, async (req, res) => {
  try {
    const dateParam = req.params.date as string;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dateParam) {
      return res.status(400).json({ error: "Invalid date parameter" });
    }

    // Parse date parameter using shared utility
    const dateResult = parseDate(dateParam);
    if (!dateResult.success || !dateResult.data) {
      return res.status(400).json({ error: dateResult.error ?? "Invalid date format" });
    }

    const { year, month, day } = dateResult.data;

    // Create range for the entire local day using shared utility
    const { start: startOfDay, end: endOfDay } = getDayRange(year, month, day);

    // Check cache first
    const cachedEntry = await cache.getCachedEntry(userId, dateParam);

    if (cachedEntry) {
      logger.debug({ userId, date: dateParam }, "Cache hit for entry");
      return res.json(cachedEntry);
    }

    // Query entry for the date
    const entry = await EntryModel.findOne({
      userId: userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).lean(); // Use lean() for better performance

    if (!entry) {
      return res.status(404).json({ error: "Entry not found for this date" });
    }

    // Cache the result
    await cache.cacheEntry(userId, dateParam, entry);

    return res.json(entry);
  } catch (error) {
    logger.error(
      { err: error, userId: req.userId, date: req.params.date },
      "Error fetching entry",
    );
    return res.status(500).json({ error: "Error fetching entry" });
  }
});

router.post("/entry/:date", authHandle, async (req, res) => {
  try {
    const dateParam = req.params.date as string;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dateParam) {
      return res.status(400).json({ error: "Invalid date parameter" });
    }

    const validationResult = entrySchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validationResult.error.issues,
      });
    }

    const { title, text, mood, todos, tags } = validationResult.data;

    // Sanitize text input to prevent XSS
    const sanitizedText = sanitizeInput(text);
    const sanitizedTitle = sanitizeInput(title);

    // Parse date parameter using shared utility
    const dateResult = parseDate(dateParam);
    if (!dateResult.success || !dateResult.data) {
      return res.status(400).json({ error: dateResult.error ?? "Invalid date format" });
    }

    const { year, month, day } = dateResult.data;

    // Create date at local midnight using shared utility
    const entryDate = createDateAtMidnight(year, month, day);

    // Create or update entry (upsert)
    const entry = await EntryModel.findOneAndUpdate(
      {
        userId: userId,
        date: entryDate,
      },
      {
        userId: userId,
        date: entryDate,
        title: sanitizedTitle,
        text: sanitizedText,
        mood: mood,
        todos: todos || undefined,
        tags: tags || undefined,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    // Invalidate cache for this entry and its month
    await cache.invalidateEntry(userId, entryDate);

    return res.json(entry);
  } catch (error) {
    logger.error(
      { err: error, userId: req.userId, date: req.params.date },
      "Error creating/updating entry",
    );
    return res.status(500).json({ error: "Error creating/updating entry" });
  }
});

export default router;
