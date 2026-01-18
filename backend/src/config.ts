import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "journal-backend" },
});

if (!process.env.MONGODB_URL) {
  throw new Error("Set the variable MONGODB_URL");
}
if (!process.env.JWT_SECRET) {
  throw new Error("Set the variable JWT_SECRET");
}

export const MONGODB_URL = process.env.MONGODB_URL;
export const JWT_SECRET = process.env.JWT_SECRET;

