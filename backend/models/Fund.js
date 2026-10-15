import mongoose from "mongoose";

// One row = one fund (about 126 rows). Cards and filters use this.
const fundSchema = new mongoose.Schema({
  _id: String,          // "SIF-11"
  name: String,
  fundHouse: String,
  strategy: String,
  plan: String,         // Direct / Regular
  option: String,       // Growth / IDCW
  aum: Number,          // money in the fund (Rs crore)
  latestNav: Number,
  previousNav: Number,
  change: Number,
  changePct: Number,
  navDate: Date,
});

export default mongoose.model("Fund", fundSchema);