import "dotenv/config";
import mongoose from "mongoose";
import fetchNav from "./jobs/fetchNav.js";

try {
  await mongoose.connect(process.env.MONGO_URI); // 1. connect first
  console.log("MongoDB connected");
  await fetchNav();                              // 2. run the worker once
} catch (err) {
  console.error("Seed failed:", err.message);
} finally {
  await mongoose.disconnect();                   // 3. close so the script can exit
}