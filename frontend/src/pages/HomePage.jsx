import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function HomePage() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => { clearTimeout(t); window.removeEventListener("resize", handleResize); };
  }, []);

  return (
    <>
      {/* ─── TOP NAV ─── */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
  
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? 18 : 22, letterSpacing: "-0.5px" }}>
              Form<span style={{ color: "#ffc42e" }}>AI</span>
            </span>
          </span>
        </div>

        <div style={styles.navTabs}>
          {["Track", "Exercises", "Help"].map(label => (
            <Link key={label} to={`/${label.toLowerCase()}`} style={{ textDecoration: "none" }}>
              <button style={{ ...styles.navTab, ...(label === "Track" ? styles.navTabActive : {}) }}>
                {label}
              </button>
            </Link>
          ))}
        </div>

        <button style={styles.profileBtn} onClick={() => setProfileOpen(true)} title="Profile">
          🧑
        </button>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <div style={styles.hero}>
        <div style={styles.glow1} />
        <div style={styles.glow2} />

        {/* Centered content column — max width on desktop */}
        <div style={styles.heroInner}>
          <div style={{
            ...styles.heroContent,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}>
            <div style={styles.badge}>
              <span style={styles.badgeDot} />
              <span style={styles.badgeText}>AI-POWERED ANALYSIS</span>
            </div>

            <h1 style={{ ...styles.headline, fontSize: isMobile ? 46 : 72 }}>
              AI Fitness<br />
              <span style={{ color: "#ffc42e" }}>Coach</span>
            </h1>

            <p style={{ ...styles.subheadline, fontSize: isMobile ? 15 : 18 }}>
              Real-time Tracking. Real Help.
            </p>

            <div style={styles.ctaRow}>
              <Link to="/tracker" style={{ textDecoration: "none" }}>
                <button style={{ ...styles.primaryBtn, padding: isMobile ? "14px 30px" : "16px 40px", fontSize: isMobile ? 15 : 17 }}>
                  Start Training →
                </button>
              </Link>
              <Link to="/exercises" style={{ textDecoration: "none" }}>
                <button style={{ ...styles.secondaryBtn, padding: isMobile ? "14px 28px" : "16px 36px", fontSize: isMobile ? 14 : 16 }}>
                  Browse Exercises
                </button>
              </Link>
            </div>

            <div style={styles.statsRow}>
              {[
                { val: "98%", lbl: "Accuracy" },
                { val: "12+", lbl: "Exercises" },
                { val: "Live", lbl: "Feedback" },
              ].map((s, i) => (
                <div key={s.lbl} style={{
                  ...styles.statItem,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(14px)",
                  transition: `opacity 0.6s ease ${0.2 + i * 0.1}s, transform 0.6s ease ${0.2 + i * 0.1}s`,
                  padding: isMobile ? "14px 20px" : "18px 32px",
                }}>
                  <div style={{ ...styles.statVal, fontSize: isMobile ? 20 : 28 }}>{s.val}</div>
                  <div style={styles.statLbl}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── PROFILE SHEET ─── */}
      {profileOpen && (
        <div style={styles.overlay} onClick={() => setProfileOpen(false)}>
          <div style={{ ...styles.sheet, maxWidth: isMobile ? "100%" : 480 }} onClick={e => e.stopPropagation()}>
            <div style={styles.sheetHandle} />
            <div style={styles.profileAvatar}>🧑</div>
            <div style={styles.profileName}>Alex Johnson</div>
            <div style={styles.profileEmail}>alex@example.com</div>
            <div style={styles.profileStatRow}>
              {[
                { val: "24", lbl: "Sessions" },
                { val: "8 wks", lbl: "Streak" },
                { val: "Pro", lbl: "Plan" },
              ].map(s => (
                <div key={s.lbl} style={styles.profileStat}>
                  <div style={styles.profileStatVal}>{s.val}</div>
                  <div style={styles.profileStatLbl}>{s.lbl}</div>
                </div>
              ))}
            </div>
            <button style={styles.closeBtn} onClick={() => setProfileOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(13,13,15,0.92)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    padding: "14px clamp(20px, 5vw, 60px)",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
  },
  navLogo: { display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start" },
  logoMark: { fontSize: 18, filter: "drop-shadow(0 0 6px #ffc42e)" },
  navTabs: {
    display: "flex", gap: 6,
    background: "#1e1e23", padding: 4,
    borderRadius: 50, border: "1px solid rgba(255,255,255,0.07)",
  },
  navTab: {
    padding: "7px 16px", borderRadius: 50, border: "none",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, fontWeight: 500, color: "#666", background: "transparent",
    whiteSpace: "nowrap",
  },
  navTabActive: { background: "#ffc42e", color: "#0d0d0f", fontWeight: 600 },
  profileBtn: {
    width: 36, height: 36, borderRadius: "50%", border: "none",
    cursor: "pointer", background: "linear-gradient(135deg, #ffc42e, #60d4f0)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
    flexShrink: 0,
    marginLeft: "auto",
  },

  hero: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "calc(100vh - 65px)",
    background: "#0d0d0f",
    position: "relative",
    overflow: "hidden",
    padding: "40px clamp(20px, 5vw, 80px)",
  },
  heroInner: {
    width: "100%",
    maxWidth: 800,
    margin: "0 auto",
    zIndex: 1,
  },
  glow1: {
    position: "absolute", top: "10%", left: "50%",
    transform: "translateX(-50%)",
    width: "clamp(280px, 50vw, 600px)",
    height: "clamp(280px, 50vw, 600px)",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(200,240,96,0.10) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  glow2: {
    position: "absolute", bottom: "20%", right: "-5%",
    width: "clamp(180px, 30vw, 400px)",
    height: "clamp(180px, 30vw, 400px)",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(96,212,240,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  heroContent: {
    display: "flex", flexDirection: "column",
    alignItems: "center", textAlign: "center",
    width: "100%",
  },
  badge: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(200,240,96,0.1)", border: "1px solid rgba(200,240,96,0.25)",
    borderRadius: 50, padding: "5px 14px", marginBottom: 20,
  },
  badgeDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#ffc42e", boxShadow: "0 0 8px #ffc42e",
  },
  badgeText: {
    fontSize: 10, fontWeight: 700, letterSpacing: "1.8px",
    color: "#ffc42e", fontFamily: "'DM Sans', sans-serif",
  },
  headline: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800,
    lineHeight: 1.1, letterSpacing: "-1px",
    color: "#f0f0f0", marginBottom: 14,
  },
  subheadline: {
    color: "rgba(240,240,240,0.55)",
    marginBottom: 30, fontFamily: "'DM Sans', sans-serif",
  },
  ctaRow: {
    display: "flex", gap: 12, marginBottom: 40,
    flexWrap: "wrap", justifyContent: "center",
  },
  primaryBtn: {
    borderRadius: 50,
    background: "#ffc42e", color: "#0d0d0f", border: "none",
    cursor: "pointer", fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    boxShadow: "0 4px 24px rgba(200,240,96,0.25)",
  },
  secondaryBtn: {
    borderRadius: 50,
    background: "transparent", color: "#f0f0f0",
    border: "1px solid rgba(255,255,255,0.15)",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
  },
  statsRow: {
    display: "flex", gap: "clamp(10px, 2vw, 24px)",
    flexWrap: "wrap", justifyContent: "center",
  },
  statItem: {
    background: "#1e1e23", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, textAlign: "center", minWidth: 80, flex: "1 1 auto",
  },
  statVal: { fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#ffc42e" },
  statLbl: {
    fontSize: 10, color: "#666", textTransform: "uppercase",
    letterSpacing: "1px", marginTop: 3, fontFamily: "'DM Sans', sans-serif",
  },

  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "flex-end",
    justifyContent: "center",
  },
  sheet: {
    width: "100%", margin: "0 auto", background: "#161619",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTop: "1px solid rgba(255,255,255,0.07)", padding: "28px 24px 48px",
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    background: "rgba(255,255,255,0.07)", margin: "0 auto 24px",
  },
  profileAvatar: {
    width: 72, height: 72, borderRadius: "50%",
    background: "linear-gradient(135deg, #ffc42e, #60d4f0)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 28, margin: "0 auto 20px",
  },
  profileName: {
    fontFamily: "'Syne', sans-serif", fontWeight: 700,
    fontSize: 18, textAlign: "center", marginBottom: 4, color: "#f0f0f0",
  },
  profileEmail: { fontSize: 13, color: "#666", textAlign: "center", marginBottom: 24 },
  profileStatRow: { display: "flex", gap: 12, marginBottom: 24 },
  profileStat: {
    flex: 1, background: "#1e1e23", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: 14, textAlign: "center",
  },
  profileStatVal: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#ffc42e" },
  profileStatLbl: { fontSize: 11, color: "#666", marginTop: 2 },
  closeBtn: {
    display: "block", width: "100%", padding: 14, borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.07)", background: "transparent",
    color: "#666", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer",
  },
};

export default HomePage;