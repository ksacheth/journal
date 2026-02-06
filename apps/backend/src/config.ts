import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "journal-backend" },
});

if (!process.env.MONGODB_URL) {
  throw new Error("Set the variable MONGODB_URL");
}

// Support both AUTH_SECRET (NextAuth) and JWT_SECRET (legacy) for backward compatibility
const authSecret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
if (!authSecret) {
  throw new Error("Set the variable AUTH_SECRET or JWT_SECRET");
}

export const MONGODB_URL = process.env.MONGODB_URL;
export const JWT_SECRET = authSecret;
export const AUTH_SECRET = authSecret;

// Cache TTL configuration (in seconds) - environment configurable with defaults
export const CACHE_TTL = {
  // 1 hour default for single entry
  ENTRY: parseInt(process.env.CACHE_TTL_ENTRY ?? "3600", 10),
  // 30 minutes default for monthly entries list
  MONTH: parseInt(process.env.CACHE_TTL_MONTH ?? "1800", 10),
  // 24 hours default for user entries metadata
  USER_ENTRIES: parseInt(process.env.CACHE_TTL_USER_ENTRIES ?? "86400", 10),
};
