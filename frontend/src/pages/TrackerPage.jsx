import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PoseTracker from "../components/PoseTracker";
import ExerciseSelector from "../components/tracker/ExerciseSelector";
import { EXERCISES } from "@/utils/exercises";
import Nav from "@/components/layout/Nav";

function TrackerPage() {
  const [visible, setVisible] = useState(false);
  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id);
  const [sessionActive, setSessionActive] = useState(false);
  const [startTime, setStartTime]   = useState(null);
  const [elapsed, setElapsed]       = useState(0);
  const [repCount, setRepCount]     = useState(0);
  const [formIssues, setFormIssues] = useState([]);
  const sessionIdRef = useRef(null);
  const navigate = useNavigate();


  useEffect(() => {
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => setVisible(true), 60);
    return () => { document.body.style.overflow = ""; clearTimeout(t); };
  }, []);


  useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive, startTime]);

  const handleStart = () => {
    sessionIdRef.current = `session_${Date.now()}`;
    setRepCount(0);
    setFormIssues([]);
    setElapsed(0);
    setStartTime(Date.now());
    setSessionActive(true);
  };

  const handleRepComplete = useCallback(({ repCount: newCount, formIssues: newIssues }) => {
    setRepCount(newCount);
    setFormIssues((prev) => {
      const merged = new Set([...prev, ...newIssues]);
      return [...merged];
    });
  }, []);

  const handleFinish = () => {
    const exercise = EXERCISES.find((e) => e.id === exerciseId);
    const durationSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    const sessionData = {
      session_id: sessionIdRef.current ?? "anonymous",
      exercise_id: exerciseId,
      exercise_name: exercise?.name ?? exerciseId,
      duration_seconds: durationSeconds,
      rep_count: repCount,
      valid_reps: repCount,
      avg_accuracy_score: 0,
      issues: formIssues,
      exerciseId,
      exerciseName: exercise?.name ?? exerciseId,
      durationSeconds,
    };
    setSessionActive(false);
    navigate("/summary", { state: { sessionData } });
  };

  return (
    <div style={styles.page}>
      <Nav />

      {!sessionActive ? (
        <div style={{
          ...styles.presession,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}>
          <div style={styles.cameraIcon}>📷</div>
          <h2 style={styles.presessionTitle}>Ready to Train?</h2>
          <p style={styles.presessionSub}>
            Choose an exercise and allow camera access to start tracking.
          </p>

        <div style={styles.selectorWrap}>
  {/* 我们临时不用那个可能坏掉的组件，直接用原生 select */}
  <select
    value={exerciseId}
    onChange={(e) => {
      console.log("选中的新动作:", e.target.value);
      setExerciseId(e.target.value);
    }}
    style={{
      padding: "10px 20px",
      borderRadius: "10px",
      background: "#1e1e23",
      color: "#ffc42e",
      border: "1px solid rgba(255,196,46,0.3)",
      fontSize: "16px",
      outline: "none",
      cursor: "pointer"
    }}
  >
    {/* 必须确保这里的 value 和后端 api.py 里的字典 Key 一模一样 */}
    <option value="Squat">Squat</option>
    <option value="Push-Up">Push-Up</option>
    <option value="Forward Lunge">Forward Lunge</option>
    <option value="Plank">Plank</option>
  </select>
</div>

          <button onClick={handleStart} style={styles.startBtn}>
            Start Workout →
          </button>
        </div>
      ) : (

        <div style={styles.activeSession}>
          {/* Stats bar */}
          <div style={styles.statsBar}>
            <span style={styles.exerciseName}>
              {EXERCISES.find((e) => e.id === exerciseId)?.name}
            </span>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>TIME</span>
              <span style={styles.statVal}>
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
              </span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>REPS</span>
              <span style={styles.statVal}>{repCount}</span>
            </div>
            <button onClick={handleFinish} style={styles.finishBtn}>
              Finish
            </button>
          </div>

          <PoseTracker
            exercise={exerciseId}
            sessionId={sessionIdRef.current}
            onRepComplete={handleRepComplete}
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#0d0d0f",
    minHeight: "100vh",
    color: "white",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },


  presession: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    gap: 16,
  },
  cameraIcon: { fontSize: 56, opacity: 0.5 },
  presessionTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800, fontSize: 32,
    color: "#f0f0f0", margin: 0,
  },
  presessionSub: {
    fontSize: 15, color: "rgba(240,240,240,0.5)",
    fontFamily: "'DM Sans', sans-serif", textAlign: "center",
    maxWidth: 320, margin: 0,
  },
  selectorWrap: { marginTop: 8 },
  startBtn: {
    marginTop: 8,
    padding: "14px 36px",
    borderRadius: 50,
    background: "#ffc42e",
    color: "#0d0d0f",
    border: "none",
    cursor: "pointer",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    boxShadow: "0 4px 24px rgba(255,196,46,0.3)",
  },

  activeSession: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "12px clamp(12px, 3vw, 32px) 16px",
    gap: 12,
  },
  statsBar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "10px 20px",
    background: "#1e1e23",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.07)",
    flexWrap: "wrap",
    position: "relative",
    zIndex: 10,
    flexShrink: 0,
    
  },
  exerciseName: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800, fontSize: 15,
    color: "#ffc42e", flex: 1,
    minWidth: 0, overflow: "hidden",
    textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  statItem: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    flexShrink: 0,
  },
  statLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: "1.5px",
    color: "#666", fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
  },
  statVal: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800,
    fontSize: 18, color: "#f0f0f0",
    whiteSpace: "nowrap",
  },
  finishBtn: {
    padding: "8px 20px",
    borderRadius: 50,
    background: "rgba(255,77,77,0.15)",
    border: "1px solid rgba(255,77,77,0.4)",
    color: "#ff4d4d",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700, fontSize: 13,
    cursor: "pointer",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
};

export default TrackerPage;