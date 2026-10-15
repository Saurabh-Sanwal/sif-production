import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import Stats from "./components/Stats";
import Filters from "./components/Filters";
import FundCard from "./components/FundCard";
import HistoryChart from "./components/HistoryChart";
import AumChart from "./components/AumChart";
import { getFunds, getFilters, getStats, refreshData } from "./api/api";

export default function App() {
  const [funds, setFunds] = useState([]);

const [dbStats, setDbStats] = useState(null);   
  const [options, setOptions] = useState({ fundHouses: [], strategies: [], plans: [], options: [] });
  const [filters, setFilters] = useState({
    plan: "Regular",
    option: "Growth",
    fundHouse: "",
    strategy: "",
    search: "",
    sort: "aum_desc",
  });
  const [selected, setSelected] = useState(null); // fund whose graph is open
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. dropdown choices (once)
  useEffect(() => {
    getFilters()
      .then((f) => {
        setOptions(f);
        // if "Regular"/"Growth" are not spelled like that in the data, clear them
        setFilters((old) => ({
          ...old,
          plan: f.plans.includes(old.plan) ? old.plan : "",
          option: f.options.includes(old.option) ? old.option : "",
        }));
      })
      .catch(() => {});
  }, []);

  // 2. load funds now, when a filter changes, and again every 60 seconds
  async function loadFunds() {
    try {
      const data = await getFunds(filters);
      setFunds(data.funds);
      getStats().then(setDbStats).catch(() => {});

<Stats funds={funds} db={dbStats} />     
      setError("");
    } catch {
      setError("Cannot reach the backend. Is it running on port 5000?");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadFunds();
    const timer = setInterval(loadFunds, 60000);
    return () => clearInterval(timer); // stop the old timer when filters change
  }, [filters]);

  // 3. Refresh button: ask the backend to download new data, then reload
  async function handleRefresh() {
    await refreshData();
    await loadFunds();
  }

  return (
    <div className="page">
      <Navbar onRefresh={handleRefresh} />

      <header className="hero">
        <h1>Track SIF fund prices</h1>
        <p>Real NAV data, updated automatically. Click a card to see its price history.</p>
      </header>

      {error && <p className="error">{error}</p>}

      <Stats funds={funds} />
      <Filters filters={filters} setFilters={setFilters} options={options} />

      {selected && <HistoryChart fund={selected} onClose={() => setSelected(null)} />}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : funds.length === 0 ? (
        <p className="muted">No funds found. Did you run npm run seed?</p>
      ) : (
        <>
          <section className="grid">
            {funds.map((f) => (
              <FundCard key={f._id} fund={f} onView={() => setSelected(f)} />
            ))}
          </section>
          <AumChart funds={funds} />
        </>
      )}
    </div>
  );
}