import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PoseTracker from "../components/PoseTracker";
import ExerciseSelector from "../components/tracker/ExerciseSelector";
import { EXERCISES } from "@/utils/exercises";

/*
TrackerPage — the core workout page.

Flow:
  1. Pre-session: user picks an exercise, clicks "Start Workout"
  2. Active session: PoseTracker runs, backend returns reps + form feedback
  3. On "Finish Workout": build a WorkoutSummary and navigate to /summary
     with sessionData in router state (no localStorage needed)

State design:
  - repCount / formIssues are driven by PoseTracker via the onRepComplete callback
  - elapsed time is tracked locally with setInterval
  - sessionId is a timestamp string — unique per session, used to key the
    backend SquatDetector so rep count doesn't bleed across sessions
*/
function TrackerPage() {
  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id);
  const [sessionActive, setSessionActive] = useState(false);
  const [startTime, setStartTime]   = useState(null);
  const [elapsed, setElapsed]       = useState(0);
  const [repCount, setRepCount]     = useState(0);
  const [formIssues, setFormIssues] = useState([]);
  const sessionIdRef = useRef(null); // stable across renders during a session
  const navigate = useNavigate();

  // Live timer — ticks every second while session is active
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

  // Called by PoseTracker every time the backend counts a completed rep.
  // useCallback keeps the reference stable so PoseTracker doesn't need to
  // re-initialize MediaPipe when this parent component re-renders.
  const handleRepComplete = useCallback(({ repCount: newCount, formIssues: newIssues }) => {
    setRepCount(newCount);
    // Accumulate unique issues across all reps (deduped for the LLM prompt)
    setFormIssues((prev) => {
      const merged = new Set([...prev, ...newIssues]);
      return [...merged];
    });
  }, []);

  const handleFinish = () => {
    const exercise = EXERCISES.find((e) => e.id === exerciseId);
    const durationSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    // Build the WorkoutSummary shape expected by POST /analyze-workout
    const sessionData = {
      session_id: sessionIdRef.current ?? "anonymous",
      exercise_id: exerciseId,
      exercise_name: exercise?.name ?? exerciseId,
      duration_seconds: durationSeconds,
      rep_count: repCount,
      valid_reps: repCount,   // SquatDetector only counts reps that complete full range
      avg_accuracy_score: 0,  // placeholder until scoring logic is added
      issues: formIssues,
      // Camelcase aliases used by SummaryPage display
      exerciseId,
      exerciseName: exercise?.name ?? exerciseId,
      durationSeconds,
    };

    setSessionActive(false);
    navigate("/summary", { state: { sessionData } });
  };

  return (
    <div style={{
      backgroundColor: "#000", minHeight: "100vh", color: "white",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <h2 style={{ marginBottom: "8px" }}>AI Trainer</h2>

      {/* ── Pre-session ── */}
      {!sessionActive ? (
        <div style={{ textAlign: "center", marginTop: "80px" }}>
          <div style={{ fontSize: "50px" }}>📷</div>
          <p>Choose an exercise and allow camera access to start tracking.</p>

          <ExerciseSelector
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
          />

          <button
            onClick={handleStart}
            style={{
              marginTop: "16px",
              backgroundColor: "#d4ff70", color: "black",
              padding: "10px 28px", borderRadius: "20px",
              border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "16px",
            }}
          >
            Start Workout
          </button>
        </div>
      ) : (
        /* ── Active session ── */
        <div style={{ width: "90%", maxWidth: "800px", marginTop: "12px" }}>
          {/* Session stats bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "10px", padding: "8px 16px",
            backgroundColor: "#111", borderRadius: "12px",
          }}>
            <span style={{ color: "#d4ff70", fontWeight: "bold" }}>
              {EXERCISES.find((e) => e.id === exerciseId)?.name}
            </span>
            <span>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
            <span>Reps: {repCount}</span>
            <button
              onClick={handleFinish}
              style={{
                backgroundColor: "#ff4d4d", color: "white",
                padding: "6px 18px", borderRadius: "16px",
                border: "none", cursor: "pointer", fontWeight: "bold",
              }}
            >
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

export default TrackerPage;
