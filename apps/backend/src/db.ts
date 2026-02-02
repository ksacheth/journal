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

// Track in-flight connection promise to prevent concurrent connection attempts
let inFlightConnectionPromise: Promise<void> | null = null;

export async function connectDb(): Promise<void> {
  // Check if already connected to avoid reconnection
  if (mongoose.connection.readyState === 1) {
    logger.debug("Database connection already established");
    return;
  }

  // Check if already connecting (readyState === 2) and return the in-flight promise
  if (inFlightConnectionPromise) {
    logger.debug("Connection already in progress, awaiting existing promise");
    return inFlightConnectionPromise;
  }

  // Create new connection promise
  inFlightConnectionPromise = (async () => {
    try {
      await mongoose.connect(MONGODB_URL, connectionOptions);
      logger.info("Connected to database");
    } catch (error) {
      logger.error({ err: error }, "Error while connecting to database");
      throw error;
    } finally {
      // Clear the in-flight promise on success or error
      inFlightConnectionPromise = null;
    }
  })();

  return inFlightConnectionPromise;
}

/**
 * Check if database connection is healthy
 * Reuses existing connection state without re-connecting
 */
export function isDbHealthy(): boolean {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  return mongoose.connection.readyState === 1;
}

