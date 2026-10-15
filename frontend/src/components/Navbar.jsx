export default function Navbar({ onRefresh }) {
  return (
    <nav className="navbar">
      <span className="logo">SIF TRACKER</span>
      <button className="btn" onClick={onRefresh}>Refresh</button>
    </nav>
  );
}