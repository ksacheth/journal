import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
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

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  // Log response when it finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      origin: req.headers.origin,
      hasAuth: !!req.headers.authorization,
      hasCookies: !!req.headers.cookie,
    };

    if (res.statusCode >= 400) {
      logger.warn(logData, "❌ Request failed");
    } else {
      logger.info(logData, "✅ Request completed");
    }
  });

  next();
});

// Trust proxy (required for rate limiting to work correctly with nginx)
app.set("trust proxy", 1);

// Configure CORS
const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

logger.info({ corsOrigins }, "CORS origins configured");

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn({ origin, allowed: corsOrigins }, "CORS origin blocked");
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
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

// Serve static files from the built frontend
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

// Serve index.html for all non-API routes (SPA support)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error(
    {
      err,
      method: req.method,
      path: req.path,
    },
    "Unhandled server error",
  );
  return res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      nodeEnv: process.env.NODE_ENV,
      corsOrigins,
      mongoConnected: isDbHealthy(),
      cacheConnected: cache.isHealthy(),
      hasAuthSecret: !!process.env.AUTH_SECRET,
    },
    "🚀 Server listening",
  );
});
