/*
api.js — fetch wrappers for backend endpoints.

All requests go to /api/* which Vite proxies to http://127.0.0.1:8000 in dev.
In production the same server handles both the frontend and the API.

Reference: https://vitejs.dev/config/server-options.html#server-proxy
*/

/*
analyzeWorkout — sends session summary to the backend and returns AI coaching.

Parameters:
  sessionData — object built in TrackerPage containing exercise info, rep count,
                duration, and accumulated form issues from SquatDetector.

Returns the full Scenario B response shape:
  {
    summary:    { exercise_type, total_reps, valid_reps, avg_accuracy_score }
    biometrics: { max_depth, stability, symmetry_issue }
    ai_coaching:{ message, tutorial_video }
  }

Throws if the network request fails or the server returns a non-ok status.
*/
export async function analyzeWorkout(sessionData) {
  const response = await fetch("/api/analyze-workout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
}
