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

// Trust proxy (required for rate limiting to work correctly with nginx)
app.set("trust proxy", 1);

// Configure CORS
const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];
const envOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

logger.info({ corsOrigins }, "CORS origins configured");

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, or same-origin requests)
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

// Add no-cache headers for HTML files (always get fresh content)
app.use((req, res, next) => {
  // HTML files and SPA routes should not be cached
  if (req.path.endsWith(".html") || !req.path.includes(".")) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

// Serve static assets with cache (they have hashed filenames)
app.use(
  express.static(publicPath, {
    maxAge: process.env.NODE_ENV === "production" ? "1d" : 0,
    etag: true,
  }),
);

// Serve index.html for all non-API routes (SPA support)
// Try to serve route-specific index.html first, then fall back to root index.html
app.get(/^\/(?!api).*/, (req, res) => {
  const fs = require("fs");

  // Try to find a route-specific index.html
  // For /entry/2024-01 -> try /entry/2024-01/index.html, then /entry/index.html, then /index.html
  const pathParts = req.path.split("/").filter(Boolean);

  // Try each level of the path
  for (let i = pathParts.length; i >= 0; i--) {
    const tryPath = path.join(
      publicPath,
      ...pathParts.slice(0, i),
      "index.html",
    );
    if (fs.existsSync(tryPath)) {
      return res.sendFile(tryPath);
    }
  }

  // Final fallback to root index.html
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
  logger.info({ port: PORT }, "Server listening");
});
