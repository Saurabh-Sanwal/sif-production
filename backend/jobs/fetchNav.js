import axios from "axios";
import { parse } from "csv-parse/sync";
import Fund from "../models/Fund.js";
import Nav from "../models/Nav.js";

const BASE = process.env.SIF_BASE_URL || "https://sif.tigzig.com";
const LOOKBACK_DAYS = Number(process.env.LOOKBACK_DAYS) || 5;
const DAY = 24 * 60 * 60 * 1000;

let running = false; // stops two runs at the same time

// Download a CSV file -> array of objects (column names in lowercase)
async function getCsv(file) {
  const res = await axios.get(`${BASE}/${file}`, { responseType: "text" });
  return parse(res.data, {
    columns: (h) => h.map((x) => x.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  });
}

// Take the first column that has a value (we try a few possible names)
const pick = (row, names) => {
  for (const n of names) if (row[n]) return row[n];
  return null;
};

// "10.92" -> 10.92.  "N.A.", 0, negative -> null (we skip them)
const toNum = (v) => {
  const n = parseFloat(String(v ?? "").replace(/,/g, ""));
  return n > 0 ? n : null;
};

// "2026-10-12" or "12-10-2026" -> Date
const toDate = (v) => {
  const s = String(v ?? "");
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return null;
};

// If the CSV column is missing, read plan / option / strategy from the fund NAME
const planFrom = (n) =>
  /direct/i.test(n) ? "Direct" : /regular/i.test(n) ? "Regular" : null;

const optionFrom = (n) =>
  /idcw|dividend/i.test(n) ? "IDCW" : /growth/i.test(n) ? "Growth" : null;

// "qsif Equity Ex-Top 100 Long-Short Fund - Growth Option - Regular Plan"
//   -> "Equity Ex-Top 100 Long-Short Fund"
const strategyFrom = (name, fundHouse) => {
  let s = name.split(/ - | Direct| Regular/i)[0].trim(); // cut at plan / option words
  const firstWord = (fundHouse || "").split(" ")[0]; // "qsif SIF" -> "qsif"
  if (firstWord && s.toLowerCase().startsWith(firstWord.toLowerCase())) {
    s = s.slice(firstWord.length).trim(); // remove the fund house from the start
  }
  return s || null;
};

export default async function fetchNav() {
  if (running) return console.log("Already running, skipped");
  running = true;

  try {
    // 1. DOWNLOAD the two files
    const metaRows = await getCsv("sif_meta.csv");
    const navRows = await getCsv("sif_nav.csv");
    console.log("meta columns:", Object.keys(metaRows[0] || {}).join(", "));
    console.log("nav columns :", Object.keys(navRows[0] || {}).join(", "));
    if (!metaRows.length || !navRows.length) throw new Error("Files are empty");

    // 2. CLEAN the prices and group them by fund
    const history = {}; // { "SIF-11": [{date, nav}, ...] }
    for (const r of navRows) {
      const code = pick(r, ["scheme_code", "code"]);
      const nav = toNum(pick(r, ["nav"]));
      const date = toDate(pick(r, ["date", "nav_date"]));
      if (!code || !nav || !date) continue; // skip bad rows
      (history[`SIF-${code}`] ||= []).push({ date, nav });
    }

    // 3. SAVE FUNDS (upsert = update if exists, create if not)
    const fundOps = [];
    for (const r of metaRows) {
      const code = pick(r, ["scheme_code", "code"]);
      if (!code) continue;
      const id = `SIF-${code}`;
      const name = pick(r, ["scheme_name", "name"]) || id;
      const fundHouse = pick(r, ["fund_house", "amc"]);

      const list = (history[id] || []).sort((a, b) => a.date - b.date);
      const last = list[list.length - 1];
      const prev = list[list.length - 2];
      const change = last && prev ? last.nav - prev.nav : 0;
      const changePct = prev ? (change / prev.nav) * 100 : 0;

      fundOps.push({
        updateOne: {
          filter: { _id: id },
          update: {
            $set: {
              name,
              fundHouse,
              strategy: pick(r, ["strategy"]) || strategyFrom(name, fundHouse),
              plan: pick(r, ["plan"]) || planFrom(name),
              option: pick(r, ["option"]) || optionFrom(name),
              aum: toNum(pick(r, ["aaum_cr_quarterly_avg", "aaum_cr", "aum"])),
              latestNav: last ? last.nav : toNum(pick(r, ["nav", "latest_nav"])),
              previousNav: prev ? prev.nav : null,
              change: Math.round(change * 10000) / 10000,
              changePct: Math.round(changePct * 10000) / 10000,
              navDate: last ? last.date : null,
            },
          },
          upsert: true,
        },
      });
    }
    await Fund.bulkWrite(fundOps);

    // 4. SAVE PRICES: first run = everything, later runs = last LOOKBACK_DAYS only
    const firstRun = (await Nav.estimatedDocumentCount()) === 0;
    const cutoff = firstRun ? 0 : Date.now() - LOOKBACK_DAYS * DAY;

    const navOps = [];
    for (const [id, list] of Object.entries(history)) {
      for (const p of list) {
        if (p.date.getTime() < cutoff) continue;
        navOps.push({
          updateOne: {
            filter: { fundId: id, date: p.date },
            update: { $set: { nav: p.nav } },
            upsert: true,
          },
        });
      }
    }
    for (let i = 0; i < navOps.length; i += 5000) {
      await Nav.bulkWrite(navOps.slice(i, i + 5000));
    }

    const summary = { funds: fundOps.length, prices: navOps.length, firstRun };
    console.log("Sync done:", summary);
    return summary;
  } catch (err) {
    // website down? keep the old data, try again next hour
    console.error("Sync failed (old data kept):", err.message);
    return { error: err.message };
  } finally {
    running = false;
  }
}