import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Home",      to: "/"          },
  { label: "Track",     to: "/tracker"   },
  { label: "Exercises", to: "/exercises" },
  { label: "Help",      to: "/help"      },
];

export default function Nav({ onProfileClick }) {
  const location = useLocation();

  return (
    <nav style={s.nav}>
      {/* Logo → home */}
      <div style={s.logo}>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <span style={s.logoText}>
            Form<span style={{ color: "#ffc42e" }}>AI</span>
          </span>
        </Link>
      </div>

      {/* Pill tabs */}
      <div style={s.tabs}>
        {NAV_ITEMS.map(({ label, to }) => {
          const isActive =
            to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(to);

          return isActive ? (
            <button key={label} style={{ ...s.tab, ...s.tabActive }}>
              {label}
            </button>
          ) : (
            <Link key={label} to={to} style={{ textDecoration: "none" }}>
              <button style={s.tab}>{label}</button>
            </Link>
          );
        })}
      </div>

      {/* Profile avatar */}
      <div style={s.right}>
        <button style={s.avatar} onClick={onProfileClick} title="Profile">
          🧑
        </button>
      </div>
    </nav>
  );
}

const s = {
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    background: "rgba(13,13,15,0.92)", backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    padding: "14px clamp(20px, 5vw, 60px)",
    display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center",
  },
  logo: { display: "flex", alignItems: "center" },
  logoText: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800,
    fontSize: "clamp(18px, 2vw, 22px)", letterSpacing: "-0.5px",
    cursor: "pointer", color: "#f0f0f0",
  },
  tabs: {
    display: "flex", gap: 6, background: "#1e1e23", padding: 4,
    borderRadius: 50, border: "1px solid rgba(255,255,255,0.07)",
  },
  tab: {
    padding: "7px 16px", borderRadius: 50, border: "none", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
    color: "#666", background: "transparent", whiteSpace: "nowrap",
    transition: "color 0.2s",
  },
  tabActive: {
    background: "#ffc42e", color: "#0d0d0f", fontWeight: 600, cursor: "default",
  },
  right: { display: "flex", justifyContent: "flex-end" },
  avatar: {
    width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
    background: "linear-gradient(135deg, #ffc42e, #60d4f0)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
  },
};