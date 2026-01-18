import express from "express";
import cors from "cors";
import { connectDb } from "./db";
import authRoutes from "./routes/auth";
import entryRoutes from "./routes/entry";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Configure CORS
const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

connectDb().catch((error) => {
  console.error("Failed to connect to database", error);
});

app.get("/api/health", async (req, res) => {
  try {
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

// Use Routes
app.use("/api", authRoutes);
app.use("/api", entryRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});