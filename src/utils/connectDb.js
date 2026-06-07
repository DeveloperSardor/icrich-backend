import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

function maskMongoUri(uri) {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
  } catch {
    return "[mongo-uri]";
  }
}

export default async function connectDb() {
  const uri = process.env.DB_URL?.trim();
  if (!uri) {
    console.error("DB_URL is missing. Set it in .env or PM2 env.");
    throw new Error("DB_URL is not set");
  }

  mongoose.set("strictQuery", true);

  console.log(`Connecting to MongoDB: ${maskMongoUri(uri)}`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20_000,
    });
    console.log("Successfully connected to DB!");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}
