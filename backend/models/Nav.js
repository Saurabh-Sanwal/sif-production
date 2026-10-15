import mongoose from "mongoose";

// One row = one fund's price on one day (about 15,000 rows). The graph uses this.
const navSchema = new mongoose.Schema({
  fundId: { type: String, ref: "Fund" }, // REFERENCE: points to Fund._id
  date: Date,
  nav: Number,
});

// One fund can have only one price per day (no duplicates)
navSchema.index({ fundId: 1, date: 1 }, { unique: true });

export default mongoose.model("Nav", navSchema);