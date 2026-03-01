import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { sendPoseData } from "../services/PoseSocket";

function SummaryPage() {
	const location  = useLocation();

	// sessionData is passed from TrackerPage via router state.
	// Falls back to null if the user navigates here directly.
	const sessionData = location.state?.sessionData ?? null;

	const [feedback, setFeedback]   = useState(null);  // AI feedback string
	const [loading, setLoading]     = useState(false);
	const [error, setError]         = useState(null);

	/*
	useEffect fires after the component mounts.
	We fetch AI feedback here rather than in TrackerPage so the user sees the
	summary stats immediately while the LLM call is in flight.
	*/
	useEffect(() => {
		if (!sessionData) return;

		setLoading(true);
		analyzeWorkout(sessionData)
			.then((data) => setFeedback(data.feedback))
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// guard against users landing here without completing a workout
	if (!sessionData) {
		return (
			<div>
				<h1>Workout Summary</h1>
				<p>No workout data found. <Link to="/tracker">Start a workout</Link>.</p>
			</div>
		);
	}

	return (
		<div>
			<h1>Workout Summary</h1>

			{/* ── Session stats ── */}
			<section>
				<h2>Session Stats</h2>
				<p><strong>Exercise:</strong> {sessionData.exerciseName}</p>
				<p><strong>Duration:</strong> {sessionData.durationSeconds}s</p>
				{/* tbd by ppl doing MediaPipe */}
				{sessionData.repCount > 0 && (
					<p><strong>Reps:</strong> {sessionData.repCount}</p>
				)}
				{sessionData.avgScore > 0 && (
					<p><strong>Avg form score:</strong> {sessionData.avgScore.toFixed(0)}/100</p>
				)}
			</section>

			{/* ── AI feedback ── */}
			<section>
				<h2>AI Coach Feedback</h2>
				{loading && <p>Analyzing your workout…</p>}
				{error   && <p style={{ color: "red" }}>Could not load feedback: {error}</p>}
				{feedback && <p>{feedback}</p>}
			</section>

			<Link to="/tracker">Start Another Workout</Link>
		</div>
	);
}

export default SummaryPage;
