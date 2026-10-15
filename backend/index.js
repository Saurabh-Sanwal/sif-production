import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cron from "node-cron";
import fundsRouter from "./routes/funds.js";
import fetchNav from "./jobs/fetchNav.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.post("/api/refresh", async (req, res) => res.json(await fetchNav())); // refresh button
app.use("/api/funds", fundsRouter);

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI); // 1. connect first, stay connected
    console.log("MongoDB connected");

    // 2. the timer: run the worker every hour
    cron.schedule(process.env.CRON_SCHEDULE || "0 * * * *", () => fetchNav(), {
      timezone: "Asia/Kolkata",
    });

    // 3. also run once right now
    if (process.env.SYNC_ON_START === "true") fetchNav();

    // 4. start the server
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server: http://localhost:${port}`));
  } catch (err) {
    console.error("Could not start:", err.message);
    process.exit(1);
  }
}

start();