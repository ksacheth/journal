import mongoose from "mongoose";
import { MONGODB_URL, logger } from "./config";

export async function connectDb() {
  try {
    await mongoose.connect(MONGODB_URL);
    logger.info("Connected to database");
  } catch (error) {
    logger.error({ err: error }, "Error while connecting to database");
    throw error;
  }
}

