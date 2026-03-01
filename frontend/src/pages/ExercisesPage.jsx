import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { EXERCISES } from "@/utils/exercises";


function Nav() {
  const location = useLocation();
  const navItems = [
    { label: "Track", to: "/tracker" },
    { label: "Exercises", to: "/exercises" },
    { label: "Help", to: "/help" },
  ];

  return (
    <nav style={navStyles.nav}>
      <div style={navStyles.logo}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>
          Form<span style={{ color: "#ffc42e" }}>AI</span>
        </span>
      </div>
      <div style={navStyles.tabs}>
        {navItems.map(({ label, to }) => {
          const isActive = location.pathname === to;
          return isActive ? (
            <button key={label} style={{ ...navStyles.tab, ...navStyles.tabActive }}>{label}</button>
          ) : (
            <Link key={label} to={to} style={{ textDecoration: "none" }}>
              <button style={navStyles.tab}>{label}</button>
            </Link>
          );
        })}
      </div>
      <div style={{ marginLeft: "auto" }}>
        <div style={navStyles.avatar}>🧑</div>
      </div>
    </nav>
  );
}

const navStyles = {
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    background: "rgba(13,13,15,0.92)", backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    padding: "14px clamp(20px, 5vw, 60px)",
    display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center",
  },
  logo: { display: "flex", alignItems: "center" },
  tabs: {
    display: "flex", gap: 6, background: "#1e1e23", padding: 4,
    borderRadius: 50, border: "1px solid rgba(255,255,255,0.07)",
  },
  tab: {
    padding: "7px 16px", borderRadius: 50, border: "none", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
    color: "#666", background: "transparent", whiteSpace: "nowrap",
  },
  tabActive: { background: "#ffc42e", color: "#0d0d0f", fontWeight: 600, cursor: "default" },
  avatar: {
    width: 36, height: 36, borderRadius: "50%",
    background: "linear-gradient(135deg, #ffc42e, #60d4f0)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 15, marginLeft: "auto",
  },
};


function ExerciseCard({ exercise }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false); // trails hovered for exit animation
  const closeTimer = useRef(null);

  // When hovered → immediately show, cancel any pending close
  // When unhovered → wait 280ms (animation duration) then unmount
  function open() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHovered(true);
    // small rAF delay so the element mounts before we flip visible→true
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }

  function close() {
    setVisible(false); // triggers CSS exit animation
    closeTimer.current = setTimeout(() => setHovered(false), 300);
  }

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <div style={{ position: "relative" }} onMouseEnter={open}>

      {/* ── Grid card ── */}
      <div style={{ ...cardStyles.card, ...(hovered ? cardStyles.cardHovered : {}) }}>
        <div style={cardStyles.thumb}>
          <img
            src={`https://img.youtube.com/vi/${exercise.videoId}/mqdefault.jpg`}
            alt={exercise.name}
            style={cardStyles.thumbImg}
          />
          <div style={cardStyles.playOverlay}>▶</div>
        </div>
        <div style={cardStyles.cardBody}>
          <div style={cardStyles.cardTitle}>{exercise.name}</div>
          <div style={cardStyles.cardMuscles}>{exercise.muscles.join(", ")}</div>
        </div>
      </div>

      {/* ── Overlay: always mounted while hovered, animated by `visible` ── */}
      {hovered && (
        <div style={cardStyles.overlayBackdrop(visible)}>
          <div
            style={{ ...cardStyles.expanded(visible), pointerEvents: "auto" }}
            onMouseLeave={close}
          >
            {/* Title + muscle pills */}
            <div>
              <h2 style={cardStyles.expandedTitle}>{exercise.name}</h2>
              <div style={cardStyles.muscleRow}>
                {exercise.muscles.map(m => (
                  <span key={m} style={cardStyles.musclePill}>{m}</span>
                ))}
              </div>
            </div>

            {/* Embedded video */}
            <div style={cardStyles.videoWrap}>
              <iframe
                src={`https://www.youtube.com/embed/${exercise.videoId}?rel=0`}
                title={`${exercise.name} tutorial`}
                style={cardStyles.iframe}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Instructions */}
            <div>
              <div style={cardStyles.sectionLabel}>HOW TO DO IT</div>
              <ol style={cardStyles.instructionList}>
                {exercise.instructions.map((step, i) => (
                  <li key={i} style={cardStyles.instructionItem}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            <div>
              <div style={cardStyles.sectionLabel}>COMMON MISTAKES</div>
              <ul style={cardStyles.tipList}>
                {exercise.tips.map((tip, i) => (
                  <li key={i} style={cardStyles.tipItem}>
                    <span style={cardStyles.tipDot}>{i + 1}</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ANIM = "0.28s cubic-bezier(0.4, 0, 0.2, 1)";

const cardStyles = {
  card: {
    background: "#1e1e23", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, overflow: "hidden", cursor: "pointer",
    transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
    display: "flex", flexDirection: "column",
  },
  cardHovered: {
    transform: "translateY(-4px)",
    borderColor: "rgba(200,240,96,0.4)",
    boxShadow: "0 8px 32px rgba(200,240,96,0.12)",
  },
  thumb: {
    position: "relative", width: "100%", aspectRatio: "16/9",
    background: "#0d0d0f", overflow: "hidden", flexShrink: 0,
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  playOverlay: {
    position: "absolute", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 24, color: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.28)",
  },
  cardBody: { padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 4 },
  cardTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#f0f0f0" },
  cardMuscles: { fontSize: 11, color: "#666", fontFamily: "'DM Sans', sans-serif" },

  // Functions so we can drive opacity/transform from `visible`
  overlayBackdrop: (visible) => ({
    position: "fixed", inset: 0,
    background: `rgba(0,0,0,${visible ? 0.78 : 0})`,
    backdropFilter: `blur(${visible ? 10 : 0}px)`,
    WebkitBackdropFilter: `blur(${visible ? 10 : 0}px)`,
    zIndex: 300,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "20px",
    pointerEvents: "none",
    transition: `background ${ANIM}, backdrop-filter ${ANIM}`,
  }),
  expanded: (visible) => ({
    width: "60vw", maxWidth: 880, minWidth: 320,
    background: "#1e1e23", border: "1px solid rgba(200,240,96,0.18)",
    borderRadius: 24, padding: "28px 32px 36px",
    display: "flex", flexDirection: "column", gap: 20,
    boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
    maxHeight: "90vh", overflowY: "auto",
    opacity: visible ? 1 : 0,
    transform: visible ? "scale(1) translateY(0)" : "scale(0.94) translateY(16px)",
    transition: `opacity ${ANIM}, transform ${ANIM}`,
  }),

  expandedTitle: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28,
    color: "#f0f0f0", margin: "0 0 10px 0",
  },
  muscleRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  musclePill: {
    padding: "3px 12px", borderRadius: 50,
    background: "rgba(200,240,96,0.1)", border: "1px solid rgba(200,240,96,0.2)",
    color: "#ffc42e", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.8px", textTransform: "uppercase",
    fontFamily: "'DM Sans', sans-serif",
  },
  videoWrap: {
    position: "relative", width: "100%", aspectRatio: "16/9",
    borderRadius: 14, overflow: "hidden", background: "#0d0d0f",
  },
  iframe: { position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: "1.8px", color: "#ffc42e",
    fontFamily: "'DM Sans', sans-serif", marginBottom: 10,
  },
  instructionList: { margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 },
  instructionItem: { fontSize: 14, color: "rgba(240,240,240,0.8)", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" },
  tipList: { margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 },
  tipItem: {
    fontSize: 13, color: "rgba(240,240,240,0.7)", lineHeight: 1.6,
    fontFamily: "'DM Sans', sans-serif", display: "flex", gap: 8, alignItems: "flex-start",
  },
  tipDot: { color: "#f0a060", fontSize: 12, flexShrink: 0, marginTop: 2 },
};

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
function ExercisesPage() {
  return (
    <div style={pageStyles.page}>
      <Nav />
      <div style={pageStyles.content}>
        <div style={pageStyles.header}>
          <h1 style={pageStyles.title}>
            Exercise <span style={{ color: "#ffc42e" }}>Library</span>
          </h1>
          <p style={pageStyles.subtitle}>Hover any card to preview form cues, instructions, and video</p>
        </div>
        <div style={pageStyles.grid}>
          {EXERCISES.map(exercise => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      </div>
    </div>
  );
}

const pageStyles = {
  page: { minHeight: "100vh", background: "#0d0d0f", display: "flex", flexDirection: "column" },
  content: { padding: "40px clamp(20px, 5vw, 60px) 80px", flex: 1 },
  header: { marginBottom: 36 },
  title: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800,
    fontSize: "clamp(28px, 4vw, 48px)", color: "#f0f0f0",
    letterSpacing: "-0.5px", marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: "#666", fontFamily: "'DM Sans', sans-serif" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },
};

export default ExercisesPage;