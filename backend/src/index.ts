import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDb, isDbHealthy } from "./db";
import authRoutes from "./routes/auth";
import entryRoutes from "./routes/entry";
import { logger } from "./config";
import { cache } from "./cache";

const app = express();
const PORT = process.env.PORT || 3001;

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception");
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, closing connections");
  await cache.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, closing connections");
  await cache.close();
  process.exit(0);
});

app.use(express.json());
app.use(cookieParser());

// Trust proxy (required for rate limiting to work correctly with nginx)
app.set("trust proxy", 1);

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
  const dbHealthy = isDbHealthy();
  const cacheHealthy = cache.isHealthy();

  const status = dbHealthy && cacheHealthy ? "healthy" : "degraded";
  const statusCode = dbHealthy ? 200 : 503;

  return res.status(statusCode).json({
    status,
    database: dbHealthy ? "connected" : "disconnected",
    cache: cacheHealthy ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
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
