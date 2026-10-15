export default function Filters({ filters, setFilters, options }) {
  // update one filter, keep the others
  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  return (
    <section className="filters">
      <input placeholder="Search fund name..." value={filters.search} onChange={set("search")} />

      <select value={filters.fundHouse} onChange={set("fundHouse")}>
        <option value="">All fund houses</option>
        {options.fundHouses.map((x) => <option key={x}>{x}</option>)}
      </select>

      <select value={filters.strategy} onChange={set("strategy")}>
        <option value="">All strategies</option>
        {options.strategies.map((x) => <option key={x}>{x}</option>)}
      </select>

      <select value={filters.plan} onChange={set("plan")}>
        <option value="">All plans</option>
        {options.plans.map((x) => <option key={x}>{x}</option>)}
      </select>

      <select value={filters.option} onChange={set("option")}>
        <option value="">All options</option>
        {options.options.map((x) => <option key={x}>{x}</option>)}
      </select>

      <select value={filters.sort} onChange={set("sort")}>
        <option value="aum_desc">Biggest AUM</option>
        <option value="nav_desc">Highest NAV</option>
        <option value="change_desc">Top gainers</option>
        <option value="change_asc">Top losers</option>
        <option value="">Name A-Z</option>
      </select>
    </section>
  );
}