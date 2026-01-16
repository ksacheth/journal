import mongoose from "mongoose";
import { MONGODB_URL } from "./config";

export async function connectDb() {
  try {
    await mongoose.connect(MONGODB_URL);
  } catch (e) {
    console.log("Error while connecting to database");
    throw e;
  }
}
