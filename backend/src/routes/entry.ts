import express from "express";
import { EntryModel } from "../models/Entry";
import { authHandle } from "../middleware/auth";
import { entrySchema } from "../validators";

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

    // Create date range for the month (in UTC)
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
    const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

    const entries = await EntryModel.find({
      userId: userId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).select("date mood -_id");

    return res.json({
      entries: entries.map((entry) => ({
        date: entry.date,
        mood: entry.mood,
      })),
    });
  } catch (error) {
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

    // Parse date parameter (assuming format: "YYYY-MM-DD")
    const date = new Date(dateParam);

    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Create range for the entire UTC day
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

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

    // Parse date parameter
    const date = new Date(dateParam);

    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Ensure it is UTC Midnight
    const entryDate = new Date(date);
    entryDate.setUTCHours(0, 0, 0, 0);

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
    return res.status(500).json({ error: "Error creating/updating entry" });
  }
});

export default router;
