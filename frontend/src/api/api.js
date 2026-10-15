// The only place that knows the server address.
// When you host the backend on Render, change this one line.
const API = "http://localhost:5000/api";

async function get(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export function getFunds(filters) {
  // remove empty filters, so we send only what is chosen
  const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  return get("/funds?" + new URLSearchParams(clean));
}

export const getFilters = () => get("/funds/filters");

export const getHistory = (id, days) =>
  get(`/funds/${id}/history` + (days ? `?days=${days}` : ""));

export const refreshData = () =>
  fetch(API + "/refresh", { method: "POST" }).then((r) => r.json());

export const getStats = () => get("/funds/stats");