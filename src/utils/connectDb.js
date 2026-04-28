import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export default async function connectDb() {
  const uri = process.env.DB_URL?.trim();
  if (!uri) {
    console.error("DB_URL is missing. Set it in backend/.env");
    throw new Error("DB_URL is not set");
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15_000,
    });
    console.log("Successfully connected to DB!");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}
