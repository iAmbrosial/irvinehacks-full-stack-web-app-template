import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Nav from "@/components/layout/Nav";



function SocialLink({ href, icon, label, handle, color }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
      <div style={{ ...helpStyles.socialCard, "--hover-color": color }}>
        <div style={{ ...helpStyles.socialIcon, background: color + "18", border: `1px solid ${color}30` }}>
          <span style={{ fontSize: 24 }}>{icon}</span>
        </div>
        <div>
          <div style={{ ...helpStyles.socialLabel, color }}>{label}</div>
          <div style={helpStyles.socialHandle}>{handle}</div>
        </div>
        <div style={helpStyles.socialArrow}>→</div>
      </div>
    </a>
  );
}

function HelpPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={helpStyles.page}>
      <Nav />
      <div style = {helpStyles.scrollArea}>
      <div style={{
        ...helpStyles.content,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>


        <div style={helpStyles.heroSection}>
          <div style={helpStyles.badge}>
            <span style={helpStyles.badgeDot} />
            <span style={helpStyles.badgeText}>DOCUMENTATION</span>
          </div>
          <h1 style={helpStyles.title}>
            How to use <span style={{ color: "#ffc42e" }}>FormAI</span>
          </h1>
          <p style={helpStyles.subtitle}>
            Your AI-powered fitness coach for real-time form analysis and feedback.
          </p>
        </div>

        <div style={helpStyles.grid}>

 
         <div style={{ ...helpStyles.card, gridColumn: "1 / -1" }}>
            <div style={helpStyles.cardHeader}>
              <h2 style={helpStyles.cardTitle}>Getting Started</h2>
            </div>
            <p style={helpStyles.cardText}>
              FormAI uses your device camera and AI to analyze your exercise form in real time. No equipment needed — just your phone or laptop camera and some space to move.
            </p>
            <div style={helpStyles.stepList}>
              {[
                { n: "1", title: "Open the Tracker", desc: "Hit the Track button in the nav or Start Training on the home page. Grant camera access when prompted." },
                { n: "2", title: "Pick your exercise", desc: "Select the exercise you're performing from the menu." },
                { n: "3", title: "Get in frame", desc: "Step back until your full body is visible. The AI needs to see your joints clearly for accurate analysis." },
                { n: "4", title: "Listen to the Advice!", desc: "The AI watches you exercise and gives you feedback based on body position." },
              ].map(s => (
                <div key={s.n} style={helpStyles.step}>
                  <div style={helpStyles.stepNum}>{s.n}</div>
                  <div>
                    <div style={helpStyles.stepTitle}>{s.title}</div>
                    <div style={helpStyles.stepDesc}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>


          <div style={helpStyles.card}>
            <div style={helpStyles.cardHeader}>
              <h2 style={helpStyles.cardTitle}>Exercise Library</h2>
            </div>
            <p style={helpStyles.cardText}>
              Head to the Exercises page to browse the full movement library. Hover any card to see an embedded tutorial video, step-by-step instructions, and common mistakes to avoid before you train.
            </p>
            <Link to="/exercises" style={{ textDecoration: "none" }}>
              <button style={helpStyles.linkBtn}>Browse Exercises →</button>
            </Link>
          </div>

          <div style={helpStyles.card}>
            <div style={helpStyles.cardHeader}>

              <h2 style={helpStyles.cardTitle}>AI Feedback</h2>
            </div>
            <p style={helpStyles.cardText}>
              The AI scores your form across three dimensions — overall form quality, range of motion, and balance. Green highlights indicate good form, orange warnings flag issues that need attention.
            </p>
            <div style={helpStyles.scoreRow}>
              {[["Form", "#ffc42e"], ["Range", "#60d4f0"], ["Balance", "#f0a060"]].map(([l, c]) => (
                <div key={l} style={{ ...helpStyles.scorePill, borderColor: c + "40", color: c, background: c + "12" }}>{l}</div>
              ))}
            </div>
          </div>


          <div style={{ ...helpStyles.card, gridColumn: "1 / -1" }}>
            <div style={helpStyles.cardHeader}>

              <h2 style={helpStyles.cardTitle}>Tips for Best Results</h2>
            </div>
            <div style={helpStyles.tipGrid}>
              {[
                { icon: "💡", text: "Good lighting helps the AI detect your joints — avoid backlighting." },
                { icon: "📐", text: "Position the camera so your full body fits in frame from head to toe." },
                { icon: "👕", text: "Wear fitted clothing so the AI can clearly see your body outline." },
                { icon: "🔄", text: "Try a side-on angle for squats and lunges, front-facing for presses." },
                { icon: "📱", text: "Prop your phone on a shelf or tripod for hands-free analysis." },
                { icon: "🎯", text: "Analyze a few reps at a time for vocal feedback" },
              ].map((t, i) => (
                <div key={i} style={helpStyles.tipItem}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <span style={helpStyles.tipText}>{t.text}</span>
                </div>
              ))}
            </div>
          </div>


          <div style={{ ...helpStyles.card, gridColumn: "1 / -1" }}>
            <div style={helpStyles.cardHeader}>

              <h2 style={helpStyles.cardTitle}>Community & Links</h2>
            </div>
            <p style={{ ...helpStyles.cardText, marginBottom: 20 }}>
              Thank you Hack at UCI!!
            </p>
            <div style={helpStyles.socialGrid}>
              <SocialLink
                href="https://instagram.com"
                icon="📸"
                label="Instagram"
                handle="@hackatuci"
                color="#e1306c"
              />
              <SocialLink
                href="https://discord.gg"
                icon="💬"
                label="Discord"
                handle="discord.gg/hackatuci"
                color="#5865f2"
              />
              <SocialLink
                href="https://github.com"
                icon="⌨️"
                label="GitHub"
                handle="https://github.com/iAmbrosial"
                color="#ffc42e"
              />
            </div>
          </div>
</div>
        </div>
      </div>
    </div>
  );
}

const helpStyles = {
  page: { height : "100vh", background: "#0d0d0f", display: "flex", flexDirection: "column", overflow: "hidden" },
  scrollArea: {flex:1, minHeight: 0, overflowY: "auto"},
  content: { padding: "40px clamp(20px, 5vw, 60px) 80px", flex: 1,minHeight:0,  maxWidth: 1100, margin: "0 auto", width: "100%", boxSizing: "border-box" },

  heroSection: { marginBottom: 40 },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "rgba(200,240,96,0.1)", border: "1px solid rgba(200,240,96,0.25)",
    borderRadius: 50, padding: "5px 14px", marginBottom: 16,
  },
  badgeDot: { width: 7, height: 7, borderRadius: "50%", background: "#ffc42e", boxShadow: "0 0 8px #ffc42e" },
  badgeText: { fontSize: 10, fontWeight: 700, letterSpacing: "1.8px", color: "#ffc42e", fontFamily: "'DM Sans', sans-serif" },
  title: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800,
    fontSize: "clamp(28px, 4vw, 52px)", color: "#f0f0f0",
    letterSpacing: "-0.5px", marginBottom: 12,
  },
  subtitle: { fontSize: 16, color: "rgba(240,240,240,0.5)", fontFamily: "'DM Sans', sans-serif", maxWidth: 500 },

  grid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
  },
  card: {
    background: "#1e1e23", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20, padding: "28px 28px 28px",
  },
  cardHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  cardIcon: { fontSize: 22 },
  cardTitle: {
    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: "#f0f0f0", margin: 0,
  },
  cardText: { fontSize: 14, color: "rgba(240,240,240,0.6)", lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", marginBottom: 0 },

  stepList: { display: "flex", flexDirection: "column", gap: 16, marginTop: 20 },
  step: { display: "flex", gap: 16, alignItems: "flex-start" },
  stepNum: {
    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
    background: "rgba(200,240,96,0.12)", border: "1px solid rgba(200,240,96,0.3)",
    color: "#ffc42e", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  stepTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#f0f0f0", marginBottom: 3 },
  stepDesc: { fontSize: 13, color: "rgba(240,240,240,0.55)", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" },

  linkBtn: {
    marginTop: 16, padding: "10px 20px", borderRadius: 50,
    background: "rgba(200,240,96,0.1)", border: "1px solid rgba(200,240,96,0.3)",
    color: "#ffc42e", fontFamily: "'Syne', sans-serif", fontSize: 13,
    fontWeight: 700, cursor: "pointer", display: "block",
  },

  scoreRow: { display: "flex", gap: 8, marginTop: 16 },
  scorePill: {
    padding: "6px 14px", borderRadius: 50, border: "1px solid",
    fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.5px",
  },

  tipGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 16 },
  tipItem: {
    display: "flex", gap: 10, alignItems: "flex-start",
    background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  tipText: { fontSize: 13, color: "rgba(240,240,240,0.6)", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" },

  socialGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
  socialCard: {
    display: "flex", alignItems: "center", gap: 14,
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, padding: "16px 18px", cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
  },
  socialIcon: {
    width: 44, height: 44, borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  socialLabel: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 2 },
  socialHandle: { fontSize: 12, color: "#666", fontFamily: "'DM Sans', sans-serif" },
  socialArrow: { marginLeft: "auto", color: "#444", fontSize: 16 },
};

export default HelpPage;