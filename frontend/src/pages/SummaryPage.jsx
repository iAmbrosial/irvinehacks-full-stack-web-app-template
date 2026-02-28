import { Link } from "react-router-dom";

/*
SummaryPage — post-workout results page.
Will display rep count, avg form score, duration, and (later) AI feedback.
Reads session data from localStorage written by TrackerPage on workout end.
*/
function SummaryPage() {
	return (
		<div>
			<h1>Workout Summary</h1>
			<p>No workout data yet. <Link to="/tracker">Start a workout</Link>.</p>
		</div>
	);
}

export default SummaryPage;
