import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { analyzeWorkout } from "@/services/api";
import Nav from "@/components/layout/Nav";

function SummaryPage() {
  const location = useLocation();
  const sessionData = location.state?.sessionData ?? null;
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "";
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!sessionData) return;
    setLoading(true);
    analyzeWorkout(sessionData)
      .then((data) => setResult(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []); 
  
  if (!sessionData) {
    return (
      <div style={s.page}>
        <Nav />
        <div style={s.empty}>
          <div style={s.emptyIcon}>🏋️</div>
          <h2 style={s.emptyTitle}>No workout data found</h2>
          <p style={s.emptySub}>Complete a session first to see your summary.</p>
          <Link to="/tracker" style={{ textDecoration: "none" }}>
            <button style={s.primaryBtn}>Start a Workout →</button>
          </Link>
        </div>
      </div>
    );
  }

  const mins = Math.floor(sessionData.durationSeconds / 60);
  const secs = sessionData.durationSeconds % 60;
  const duration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div style={s.page}>
      <Nav />

      <div style={{
        ...s.content,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>

        {/* ── Header ── */}
        <div style={s.header}>
          <div style={s.badge}>
            <span style={s.badgeDot} />
            <span style={s.badgeText}>SESSION COMPLETE</span>
          </div>
          <h1 style={s.title}>
            Workout <span style={{ color: "#ffc42e" }}>Summary</span>
          </h1>
        </div>

        {/* ── Stats cards ── */}
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <div style={s.statIcon}>🏋️</div>
            <div style={s.statVal}>{sessionData.exerciseName}</div>
            <div style={s.statLbl}>Exercise</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statIcon}>⏱️</div>
            <div style={s.statVal}>{duration}</div>
            <div style={s.statLbl}>Duration</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statIcon}>🔁</div>
            <div style={s.statVal}>{sessionData.rep_count ?? 0}</div>
            <div style={s.statLbl}>Reps</div>
          </div>
        </div>

        {/* ── Form issues ── */}
        {sessionData.issues?.length > 0 && (
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardIcon}>⚠️</span>
              <h2 style={s.cardTitle}>Form Issues Detected</h2>
            </div>
            <ul style={s.issueList}>
              {sessionData.issues.map((issue, i) => (
                <li key={i} style={s.issueItem}>
                  <span style={s.issueDot}>⚠</span>
                  <span style={s.issueText}>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── AI coaching feedback ── */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardIcon}>🤖</span>
            <h2 style={s.cardTitle}>AI Coach Feedback</h2>
            {loading && (
              <div style={s.loadingBadge}>
                <span style={s.loadingDot} />
                Analyzing…
              </div>
            )}
          </div>

          {loading && (
            <div style={s.loadingRow}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ ...s.skeleton, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}

          {error && (
            <div style={s.errorBox}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span>Could not load feedback: {error}</span>
            </div>
          )}

          {result && (
            <div style={s.resultWrap}>
              {(result.biometrics?.stability || result.biometrics?.symmetry_issue) && (
                <div style={s.biometricsRow}>
                  {result.biometrics?.stability && (
                    <div style={s.biometricPill}>
                      <span style={s.biometricLabel}>Stability</span>
                      <span style={s.biometricVal}>{result.biometrics.stability}</span>
                    </div>
                  )}
                  {result.biometrics?.symmetry_issue && (
                    <div style={{ ...s.biometricPill, borderColor: "rgba(240,160,96,0.3)", background: "rgba(240,160,96,0.08)" }}>
                      <span style={s.biometricLabel}>Note</span>
                      <span style={{ ...s.biometricVal, color: "#f0a060" }}>{result.biometrics.symmetry_issue}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Coaching message */}
              {result.ai_coaching?.message && (
                <div style={s.coachingBox}>
                  <div style={s.coachingText}>{result.ai_coaching.message}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={s.ctaRow}>
          <Link to="/tracker" style={{ textDecoration: "none" }}>
            <button style={s.primaryBtn}>Start Another Workout →</button>
          </Link>
          <Link to="/" style={{ textDecoration: "none" }}>
            <button style={s.secondaryBtn}>Back to Home</button>
          </Link>
        </div>

      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#0d0d0f", display: "flex", flexDirection: "column" },
  content: { padding: "40px clamp(20px, 5vw, 60px) 80px", flex: 1, maxWidth: 800, margin: "0 auto", width: "100%", boxSizing: "border-box" },

  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40, textAlign: "center" },
  emptyIcon: { fontSize: 56, opacity: 0.4 },
  emptyTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, color: "#f0f0f0", margin: 0 },
  emptySub: { fontSize: 15, color: "#666", fontFamily: "'DM Sans', sans-serif", margin: 0 },

  header: { marginBottom: 32 },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "rgba(255,196,46,0.1)", border: "1px solid rgba(255,196,46,0.25)",
    borderRadius: 50, padding: "5px 14px", marginBottom: 16,
  },
  badgeDot: { width: 7, height: 7, borderRadius: "50%", background: "#ffc42e", boxShadow: "0 0 8px #ffc42e" },
  badgeText: { fontSize: 10, fontWeight: 700, letterSpacing: "1.8px", color: "#ffc42e", fontFamily: "'DM Sans', sans-serif" },
  title: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(32px, 5vw, 52px)", color: "#f0f0f0", letterSpacing: "-1px", margin: 0 },

  statsGrid: { display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" },
  statCard: {
    flex: "1 1 120px", background: "#1e1e23", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20, padding: "20px 16px", textAlign: "center", display: "flex",
    flexDirection: "column", alignItems: "center", gap: 8,
  },
  statIcon: { fontSize: 24 },
  statVal: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#ffc42e" },
  statLbl: { fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'DM Sans', sans-serif" },

  card: {
    background: "#1e1e23", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20, padding: "24px 28px", marginBottom: 16,
  },
  cardHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  cardIcon: { fontSize: 20 },
  cardTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: "#f0f0f0", margin: 0, flex: 1 },

  loadingBadge: {
    display: "flex", alignItems: "center", gap: 6, marginLeft: "auto",
    fontSize: 11, color: "#ffc42e", fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
  },
  loadingDot: {
    width: 6, height: 6, borderRadius: "50%", background: "#ffc42e",
    animation: "pulse 1.2s ease-in-out infinite",
  },
  loadingRow: { display: "flex", flexDirection: "column", gap: 10 },
  skeleton: {
    height: 14, borderRadius: 8, background: "rgba(255,255,255,0.06)",
    animation: "shimmer 1.4s ease-in-out infinite",
  },

  errorBox: {
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)",
    borderRadius: 12, padding: "14px 16px",
    fontSize: 14, color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif",
  },

  resultWrap: { display: "flex", flexDirection: "column", gap: 16 },
  biometricsRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  biometricPill: {
    flex: "1 1 140px", background: "rgba(255,196,46,0.08)",
    border: "1px solid rgba(255,196,46,0.2)", borderRadius: 14, padding: "12px 16px",
  },
  biometricLabel: { display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "#666", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 },
  biometricVal: { fontSize: 15, fontWeight: 600, color: "#ffc42e", fontFamily: "'DM Sans', sans-serif" },
  coachingBox: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, padding: "18px 20px",
  },
  coachingText: { fontSize: 15, color: "rgba(240,240,240,0.8)", lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif" },

  issueList: { margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 },
  issueItem: { display: "flex", gap: 10, alignItems: "flex-start" },
  issueDot: { color: "#f0a060", fontSize: 12, flexShrink: 0, marginTop: 2 },
  issueText: { fontSize: 14, color: "rgba(240,240,240,0.75)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 },

  ctaRow: { display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" },
  primaryBtn: {
    padding: "14px 28px", borderRadius: 50,
    background: "#ffc42e", color: "#0d0d0f", border: "none",
    cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15,
    boxShadow: "0 4px 24px rgba(255,196,46,0.25)",
  },
  secondaryBtn: {
    padding: "14px 24px", borderRadius: 50,
    background: "transparent", color: "#f0f0f0",
    border: "1px solid rgba(255,255,255,0.15)",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14,
  },
};

export default SummaryPage;