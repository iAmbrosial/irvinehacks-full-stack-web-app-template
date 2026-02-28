import { Link } from "react-router-dom";
import { EXERCISES } from "@/utils/exercises";

/*
HelpPage — exercise library.

Renders a card for every exercise defined in utils/exercises.js.
*/
function ExerciseCard({ exercise }) {
	return (
		<div style={{ marginBottom: "2rem", borderBottom: "1px solid #ccc", paddingBottom: "1.5rem" }}>
			<h2>{exercise.name}</h2>
			<p><strong>Muscles:</strong> {exercise.muscles.join(", ")}</p>

			{/* YouTube embed */}
			<div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", maxWidth: "560px" }}>
				<iframe
					src={`https://www.youtube.com/embed/${exercise.videoId}?rel=0`}
					title={`${exercise.name} tutorial`}
					style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
				/>
			</div>

			{/* Step-by-step instructions */}
			<h3>How to do it</h3>
			<ol>
				{exercise.instructions.map((step, i) => (
					<li key={i}>{step}</li>
				))}
			</ol>

			{/* Form tips */}
			<h3>Common mistakes to avoid</h3>
			<ul>
				{exercise.tips.map((tip, i) => (
					<li key={i}>{tip}</li>
				))}
			</ul>
		</div>
	);
}

function HelpPage() {
	return (
		<div>
			<h1>Exercise Library</h1>
			<p>Learn proper form before you train. <Link to="/tracker">Go to Tracker</Link></p>

			{EXERCISES.map((exercise) => (
				<ExerciseCard key={exercise.id} exercise={exercise} />
			))}
		</div>
	);
}

export default HelpPage;
