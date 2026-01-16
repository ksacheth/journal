import express from "express";
import { connectDb } from "./db";
import { UserModel } from "./models/User";
import { EntryModel } from "./models/Entry";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";
import { authHandle } from "./middleware/auth";
import bcrypt from "bcryptjs";

const app = express();
app.use(express.json());

connectDb().catch((error) => {
  console.error("Failed to connect to database", error);
});

app.get("/api/health", async (req, res) => {
  try {
    // logic to connect to mongo
    await connectDb();
    return res.json({
      message: "The database is healthy",
    });
  } catch (e) {
    return res.json({
      message: "Error while connecting to database",
    });
  }
});

app.post("/api/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (
    typeof username !== "string" ||
    username.trim().length === 0 ||
    typeof password !== "string" ||
    password.trim().length === 0
  ) {
    return res.status(400).json({
      message: "Invalid input",
    });
  }

  try {
    const existingUser = await UserModel.findOne({
      username: username,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      username: username,
      password: hashedPassword,
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    return res.json({
      token,
    });
  } catch (e) {
    return res.status(500).json({
      message: "Error creating user",
    });
  }
});

app.post("/api/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (
    typeof username !== "string" ||
    username.trim().length === 0 ||
    typeof password !== "string" ||
    password.trim().length === 0
  ) {
    return res.status(400).json({
      message: "Invalid input",
    });
  }

  const existingUser = await UserModel.findOne({
    username: username,
  });

  if (!existingUser) {
    return res.status(401).json({
      message: "Access Denied",
    });
  }

  const passwordMatch = await bcrypt.compare(password, existingUser.password);

  if (passwordMatch) {
    // return a jwt
    const token = jwt.sign({ userId: existingUser.id }, JWT_SECRET);

    return res.json({
      token,
    });
  } else {
    return res.status(401).json({
      message: "Invalid Credentials",
    });
  }
});

app.get("/api/entries/:month", authHandle, async (req, res) => {
  try {
    const monthParam = req.params.month;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!monthParam || Array.isArray(monthParam)) {
      return res.status(400).json({ error: "Invalid month parameter" });
    }

    const month = monthParam;

    // Parse month parameter (assuming format: "YYYY-MM" or "MM")
    let year: number;
    let monthNum: number;

    if (month.includes("-")) {
      // Format: "YYYY-MM"
      const parts = month.split("-");
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
      monthNum = parseInt(month, 10);
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

app.get("/api/entry/:date", authHandle, async (req, res) => {
  try {
    const dateParam = req.params.date;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dateParam || Array.isArray(dateParam)) {
      return res.status(400).json({ error: "Invalid date parameter" });
    }

    // Parse date parameter (assuming format: "YYYY-MM-DD")
    // Treat it as UTC midnight
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

app.post("/api/entry/:date", authHandle, async (req, res) => {
  try {
    const dateParam = req.params.date;
    const userId = req.userId;
    const { title, text, mood, todos, tags } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dateParam || Array.isArray(dateParam)) {
      return res.status(400).json({ error: "Invalid date parameter" });
    }

    // Validate required fields
    if (!mood) {
      return res.status(400).json({ error: "Mood is required" });
    }

    if (!["excellent", "good", "neutral", "bad", "terrible"].includes(mood)) {
      return res.status(400).json({ error: "Invalid mood value" });
    }

    // Parse date parameter
    const date = new Date(dateParam);

    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Ensure it is UTC Midnight
    const entryDate = new Date(date);
    entryDate.setUTCHours(0, 0, 0, 0);

    // Validate todos if provided
    if (todos && !Array.isArray(todos)) {
      return res.status(400).json({ error: "Todos must be an array" });
    }

    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({ error: "Tags must be an array" });
    }

    if (Array.isArray(todos)) {
      for (const todo of todos) {
        if (!todo.id || !todo.text) {
          return res.status(400).json({ error: "Todos must have id and text" });
        }
      }
    }

    if (Array.isArray(tags)) {
      for (const tag of tags) {
        if (typeof tag !== "string" || !tag.trim()) {
          return res.status(400).json({ error: "Tags must be non-empty strings" });
        }
      }
    }

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
        todos: Array.isArray(todos) ? todos : undefined,
        tags: Array.isArray(tags) ? tags : undefined,
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

app.listen(3001, () => {
  console.log("Server listening on port 3001");
});
