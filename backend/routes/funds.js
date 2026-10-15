import express from "express";
import Fund from "../models/Fund.js";
import Nav from "../models/Nav.js";

const router = express.Router();

// GET /api/funds?plan=Regular&option=Growth&fundHouse=...&search=...&sort=aum_desc
router.get("/", async (req, res) => {
  try {
    const { fundHouse, strategy, plan, option, search, sort } = req.query;
    const filter = {};
    if (fundHouse) filter.fundHouse = fundHouse;
    if (strategy) filter.strategy = strategy;
    if (plan) filter.plan = plan;
    if (option) filter.option = option;
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: safe, $options: "i" };
    }
    const sorts = {
      aum_desc: { aum: -1 },
      nav_desc: { latestNav: -1 },
      change_desc: { changePct: -1 },
      change_asc: { changePct: 1 },
    };
    const funds = await Fund.find(filter).sort(sorts[sort] || { name: 1 }).lean();
    res.json({ count: funds.length, funds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/funds/filters  (must be ABOVE /:id)
router.get("/filters", async (req, res) => {
  try {
    const [fundHouses, strategies, plans, options] = await Promise.all([
      Fund.distinct("fundHouse"),
      Fund.distinct("strategy"),
      Fund.distinct("plan"),
      Fund.distinct("option"),
    ]);
    const clean = (a) => a.filter(Boolean).sort();
    res.json({
      fundHouses: clean(fundHouses),
      strategies: clean(strategies),
      plans: clean(plans),
      options: clean(options),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/funds/:id/history?days=90  -> line graph, oldest first
router.get("/:id/history", async (req, res) => {
  try {
    const filter = { fundId: req.params.id };
    const days = Number(req.query.days);
    if (days > 0) filter.date = { $gte: new Date(Date.now() - days * 86400000) };
    const rows = await Nav.find(filter).sort({ date: 1 }).select("date nav -_id").lean();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/funds/:id  -> one fund
router.get("/:id", async (req, res) => {
  try {
    const fund = await Fund.findById(req.params.id).lean();
    if (!fund) return res.status(404).json({ error: "Fund not found" });
    res.json(fund);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /api/funds/stats -> real counts in the database
router.get("/stats", async (req, res) => {
  try {
    const [totalFunds, totalPrices] = await Promise.all([
      Fund.countDocuments(),
      Nav.estimatedDocumentCount(),
    ]);
    res.json({ totalFunds, totalPrices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;