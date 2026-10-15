import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { getHistory } from "../api/api";

export default function HistoryChart({ fund, onClose }) {
  const [days, setDays] = useState(90); // 0 = all history
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // load history of THIS fund only
  useEffect(() => {
    setLoading(true);
    getHistory(fund._id, days)
      .then((data) => setRows(data.map((r) => ({ date: r.date.slice(0, 10), nav: r.nav }))))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [fund._id, days]);

  // Esc closes the popup, and the page behind does not scroll
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // small numbers above the graph
  const navs = rows.map((r) => r.nav);
  const first = navs[0];
  const last = navs[navs.length - 1];
  const pct = first ? ((last - first) / first) * 100 : 0;

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <div>
            <h2>{fund.name}</h2>
            <p className="muted small">{fund.fundHouse} · {fund.strategy}</p>
          </div>
          <button className="btn" onClick={onClose}>Close ✕</button>
        </div>

        <div className="range">
          {[[30, "30D"], [90, "90D"], [365, "1Y"], [0, "All"]].map(([d, label]) => (
            <button key={label} className={days === d ? "btn active" : "btn"} onClick={() => setDays(d)}>
              {label}
            </button>
          ))}
        </div>

        {navs.length > 0 && (
          <div className="mini-stats">
            <div><span>Latest</span><strong>{last.toFixed(4)}</strong></div>
            <div><span>High</span><strong>{Math.max(...navs).toFixed(4)}</strong></div>
            <div><span>Low</span><strong>{Math.min(...navs).toFixed(4)}</strong></div>
            <div>
              <span>Change</span>
              <strong className={pct >= 0 ? "up" : "down"}>
                {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
              </strong>
            </div>
          </div>
        )}

        <div className="chart-box">
          {loading ? (
            <p className="muted">Loading...</p>
          ) : rows.length === 0 ? (
            <p className="muted">No price history for this range.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows}>
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#262626" />
                <XAxis dataKey="date" stroke="#9a9a9a" tick={{ fontSize: 12 }} minTickGap={40} />
                <YAxis stroke="#9a9a9a" tick={{ fontSize: 12 }} domain={["auto", "auto"]} width={60} />
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid #333", color: "#fff" }} />
                <Area type="monotone" dataKey="nav" stroke="#ffffff" strokeWidth={2} fill="url(#fill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}