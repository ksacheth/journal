import mongoose from "mongoose";
import { MONGODB_URL, logger } from "./config";

// Connection pooling configuration
const connectionOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 2, // Minimum number of connections in the pool
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable buffering when not connected
};

export async function connectDb() {
  // Check if already connected to avoid reconnection
  if (mongoose.connection.readyState === 1) {
    logger.debug("Database connection already established");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URL, connectionOptions);
    logger.info("Connected to database");
  } catch (error) {
    logger.error({ err: error }, "Error while connecting to database");
    throw error;
  }
}

/**
 * Check if database connection is healthy
 * Reuses existing connection state without re-connecting
 */
export function isDbHealthy(): boolean {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  return mongoose.connection.readyState === 1;
}

