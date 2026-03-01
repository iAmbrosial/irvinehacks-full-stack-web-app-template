import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { analyzeWorkout } from "@/services/api";

function SummaryPage() {
  const location = useLocation();

  // sessionData is passed from TrackerPage via router state.
  // Falls back to null if the user navigates here directly.
  const sessionData = location.state?.sessionData ?? null;

  // result holds the full Scenario B response: { summary, biometrics, ai_coaching }
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  /*
  useEffect fires after the component mounts.
  We fetch AI feedback here rather than in TrackerPage so the user sees the
  summary stats immediately while the LLM call is in flight.
  */
  useEffect(() => {
    if (!sessionData) return;

    setLoading(true);
    analyzeWorkout(sessionData)
      .then((data) => setResult(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Guard against users landing here without completing a workout
  if (!sessionData) {
    return (
      <div style={{ padding: "32px" }}>
        <h1>Workout Summary</h1>
        <p>No workout data found. <Link to="/tracker">Start a workout</Link>.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Workout Summary</h1>

      {/* ── Session stats (shown immediately from router state) ── */}
      <section style={{ marginBottom: "24px" }}>
        <h2>Session Stats</h2>
        <p><strong>Exercise:</strong> {sessionData.exerciseName}</p>
        <p><strong>Duration:</strong> {sessionData.durationSeconds}s</p>
        {sessionData.rep_count > 0 && (
          <p><strong>Reps:</strong> {sessionData.rep_count}</p>
        )}
        {sessionData.issues?.length > 0 && (
          <div>
            <strong>Form issues detected:</strong>
            <ul>
              {sessionData.issues.map((issue, i) => <li key={i}>{issue}</li>)}
            </ul>
          </div>
        )}
      </section>

      {/* ── AI coaching feedback ── */}
      <section style={{ marginBottom: "24px" }}>
        <h2>AI Coach Feedback</h2>
        {loading && <p>Analyzing your workout…</p>}
        {error   && <p style={{ color: "red" }}>Could not load feedback: {error}</p>}

        {result && (
          <>
            {/* Biometrics from the backend */}
            <div style={{ marginBottom: "16px" }}>
              <p><strong>Stability:</strong> {result.biometrics?.stability}</p>
              {result.biometrics?.symmetry_issue && (
                <p><strong>Note:</strong> {result.biometrics.symmetry_issue}</p>
              )}
            </div>

            {/* Claude's coaching message */}
            <div style={{
              background: "#f5f5f5", borderRadius: "8px",
              padding: "16px", whiteSpace: "pre-wrap",
            }}>
              {result.ai_coaching?.message}
            </div>
          </>
        )}
      </section>

      <Link to="/tracker">Start Another Workout</Link>
    </div>
  );
}

export default SummaryPage;
