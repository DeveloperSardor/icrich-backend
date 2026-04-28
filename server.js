import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDb from "./src/utils/connectDb.js";
import Api from "./src/routers/index.js";

dotenv.config();

const app = express();

const PORT = Number.parseInt(process.env.PORT, 10) || 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors("*"));

app.use("/api", Api);

async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`Server running on PORT: ${PORT}`);
    });
  } catch (err) {
    console.error("Server failed to start:", err.message);
    process.exit(1);
  }
}

start();
