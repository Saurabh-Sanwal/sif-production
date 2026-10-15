import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

// Bar chart: the 10 funds with the biggest AUM (uses the same list as the cards)
export default function AumChart({ funds }) {
  const data = [...funds]
    .filter((f) => f.aum)
    .sort((a, b) => b.aum - a.aum)
    .slice(0, 10)
    .map((f) => ({
      name: f.name.length > 24 ? f.name.slice(0, 24) + "…" : f.name,
      aum: Math.round(f.aum),
    }));

  if (data.length === 0) return null;

  return (
    <section className="panel">
      <h2>Top funds by AUM (Rs crore)</h2>
      <div className="chart-box tall">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" stroke="#9a9a9a" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" stroke="#9a9a9a" tick={{ fontSize: 11 }} width={150} />
            <Tooltip contentStyle={{ background: "#141414", border: "1px solid #333", color: "#fff" }} />
            <Bar dataKey="aum" fill="#d4d4d4" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}