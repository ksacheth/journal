import express from "express";
import { EntryModel } from "../models/Entry";
import { authHandle } from "../middleware/auth";
import { entrySchema } from "../validators";
import { logger } from "../config";

const router = express.Router();

router.get("/entries/:month", authHandle, async (req, res) => {
  try {
    const monthParam = req.params.month;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!monthParam) {
      return res.status(400).json({ error: "Invalid month parameter" });
    }

    // Parse month parameter (assuming format: "YYYY-MM" or "MM")
    let year: number;
    let monthNum: number;

    if (monthParam.includes("-")) {
      // Format: "YYYY-MM"
      const parts = monthParam.split("-");
      const yearStr = parts[0];
      const monthStr = parts[1];

      if (!yearStr || !monthStr) {
        return res.status(400).json({ error: "Invalid month format" });
      }

      year = parseInt(yearStr, 10);
      monthNum = parseInt(monthStr, 10);
    } else {
      // Format: "MM" - use current year
      year = new Date().getFullYear();
      monthNum = parseInt(monthParam, 10);
    }

    if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: "Invalid month format" });
    }

    const pageParam = Array.isArray(req.query.page)
      ? req.query.page[0]
      : req.query.page;
    const limitParam = Array.isArray(req.query.limit)
      ? req.query.limit[0]
      : req.query.limit;
    const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(limitParam ?? "31", 10) || 31)
    );
    const skip = (page - 1) * limit;

    // Create date range for the month (local time)
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

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
        .select("date mood -_id"),
      EntryModel.countDocuments({
        userId: userId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      }),
    ]);

    return res.json({
      entries: entries.map((entry) => ({
        date: entry.date,
        mood: entry.mood,
      })),
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (error) {
    logger.error({ err: error, userId, month: monthParam }, "Error fetching entries");
    return res.status(500).json({ error: "Error fetching entries" });
  }
});

router.get("/entry/:date", authHandle, async (req, res) => {
  try {
    const dateParam = req.params.date;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dateParam) {
      return res.status(400).json({ error: "Invalid date parameter" });
    }

    // Parse date parameter (format: "YYYY-MM-DD")
    const [yearStr, monthStr, dayStr] = dateParam.split("-");
    const parsedYear = Number.parseInt(yearStr ?? "", 10);
    const parsedMonth = Number.parseInt(monthStr ?? "", 10);
    const parsedDay = Number.parseInt(dayStr ?? "", 10);

    if (
      !Number.isFinite(parsedYear) ||
      !Number.isFinite(parsedMonth) ||
      !Number.isFinite(parsedDay)
    ) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const daysInMonth = new Date(parsedYear, parsedMonth, 0).getDate();
    if (
      parsedMonth < 1 ||
      parsedMonth > 12 ||
      parsedDay < 1 ||
      parsedDay > daysInMonth
    ) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const date = new Date(parsedYear, parsedMonth - 1, parsedDay);

    // Create range for the entire local day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Query entry for the date
    const entry = await EntryModel.findOne({
      userId: userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (!entry) {
      return res.status(404).json({ error: "Entry not found for this date" });
    }

    return res.json(entry);
  } catch (error) {
    logger.error({ err: error, userId, date: dateParam }, "Error fetching entry");
    return res.status(500).json({ error: "Error fetching entry" });
  }
});

router.post("/entry/:date", authHandle, async (req, res) => {
  try {
    const dateParam = req.params.date;
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
        details: validationResult.error.errors,
      });
    }

    const { title, text, mood, todos, tags } = validationResult.data;

    // Parse date parameter (format: "YYYY-MM-DD")
    const [yearStr, monthStr, dayStr] = dateParam.split("-");
    const parsedYear = Number.parseInt(yearStr ?? "", 10);
    const parsedMonth = Number.parseInt(monthStr ?? "", 10);
    const parsedDay = Number.parseInt(dayStr ?? "", 10);

    if (
      !Number.isFinite(parsedYear) ||
      !Number.isFinite(parsedMonth) ||
      !Number.isFinite(parsedDay)
    ) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const daysInMonth = new Date(parsedYear, parsedMonth, 0).getDate();
    if (
      parsedMonth < 1 ||
      parsedMonth > 12 ||
      parsedDay < 1 ||
      parsedDay > daysInMonth
    ) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Ensure it is local midnight
    const entryDate = new Date(parsedYear, parsedMonth - 1, parsedDay);
    entryDate.setHours(0, 0, 0, 0);

    // Create or update entry (upsert)
    const entry = await EntryModel.findOneAndUpdate(
      {
        userId: userId,
        date: entryDate,
      },
      {
        userId: userId,
        date: entryDate,
        title: title || undefined,
        text: text || undefined,
        mood: mood,
        todos: todos || undefined,
        tags: tags || undefined,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.json(entry);
  } catch (error) {
    logger.error(
      { err: error, userId, date: dateParam },
      "Error creating/updating entry"
    );
    return res.status(500).json({ error: "Error creating/updating entry" });
  }
});

export default router;
