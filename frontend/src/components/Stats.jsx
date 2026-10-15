export default function Stats({ funds, db }) {
  const totalAum = funds.reduce((sum, f) => sum + (f.aum || 0), 0);
  const dates = funds.filter((f) => f.navDate).map((f) => new Date(f.navDate));
  const lastDate = dates.length ? new Date(Math.max(...dates)).toLocaleDateString("en-IN") : "-";

  return (
    <section className="stats">
      <div className="stat"><span>Funds shown (filtered)</span><strong>{funds.length}</strong></div>
      <div className="stat"><span>Funds in database</span><strong>{db ? db.totalFunds : "-"}</strong></div>
      <div className="stat"><span>Prices in database</span><strong>{db ? db.totalPrices.toLocaleString("en-IN") : "-"}</strong></div>
      <div className="stat"><span>Total AUM shown (Rs cr)</span><strong>{Math.round(totalAum).toLocaleString("en-IN")}</strong></div>
      <div className="stat"><span>Last NAV date</span><strong>{lastDate}</strong></div>
    </section>
  );
}