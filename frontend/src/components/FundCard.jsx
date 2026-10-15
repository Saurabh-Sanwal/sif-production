export default function FundCard({ fund, onView }) {
  const up = fund.change >= 0;

  return (
    <article className="card">
      <h3>{fund.name}</h3>
      <p className="muted">{fund.fundHouse} · {fund.strategy}</p>

      <div className="tags">
        {fund.plan && <span className="tag">{fund.plan}</span>}
        {fund.option && <span className="tag">{fund.option}</span>}
      </div>

      <div className="nav-row">
        <strong className="nav">{fund.latestNav ? fund.latestNav.toFixed(4) : "-"}</strong>
        <span className={up ? "up" : "down"}>
          {up ? "▲" : "▼"} {Math.abs(fund.changePct || 0).toFixed(2)}%
        </span>
      </div>

      <p className="muted small">
        AUM: {fund.aum ? Math.round(fund.aum).toLocaleString("en-IN") : "-"} cr
        {fund.navDate && ` · ${new Date(fund.navDate).toLocaleDateString("en-IN")}`}
      </p>

      <button className="btn" onClick={onView}>View History</button>
    </article>
  );
}