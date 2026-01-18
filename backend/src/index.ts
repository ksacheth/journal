import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { connectDb } from "./db";
import authRoutes from "./routes/auth";
import entryRoutes from "./routes/entry";
import { logger } from "./config";

const app = express();
const PORT = process.env.PORT || 3001;

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception");
  process.exit(1);
});

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
  logger.error({ err: error }, "Failed to connect to database");
});

app.get("/api/health", async (req, res) => {
  try {
    await connectDb();
    return res.json({
      message: "The database is healthy",
    });
  } catch (error) {
    logger.error({ err: error }, "Health check database error");
    return res.json({
      message: "Error while connecting to database",
    });
  }
});

// Use Routes
app.use("/api", authRoutes);
app.use("/api", entryRoutes);

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error(
    {
      err,
      method: req.method,
      path: req.path,
    },
    "Unhandled server error"
  );
  return res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server listening");
});
