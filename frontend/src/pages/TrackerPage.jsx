import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PoseTracker from "@/components/PoseTracker";
import ExerciseSelector from "@/components/tracker/ExerciseSelector";
import { EXERCISES } from "@/utils/exercises";


function TrackerPage() {
	const [exerciseId, setExerciseId] = useState(EXERCISES[0].id);
	const [sessionActive, setSessionActive] = useState(false);
	const [startTime, setStartTime] = useState(null);

	const navigate = useNavigate();

	const handleStart = () => {
		setSessionActive(true);
		setStartTime(Date.now());
	};

	const handleFinish = () => {
		const sessionData = {
			exerciseId,
			exerciseName: EXERCISES.find((e) => e.id === exerciseId)?.name,
			durationSeconds: startTime ? Math.round((Date.now() - startTime) / 1000) : 0,
			timestamp: Date.now(),
			// repCount, avgScore, maxScore, issues[], etc. can go here
		};
		navigate("/summary", { state: { sessionData } });
	};

	return (
		<div>
			<h1>Tracker</h1>

			<ExerciseSelector
				value={exerciseId}
				onChange={setExerciseId}
				disabled={sessionActive}
			/>

			{/* Pose detection manages its own webcam + canvas + skeleton overlay */}
			<PoseTracker />

			<div>
				{!sessionActive ? (
					<button onClick={handleStart}>Start Workout</button>
				) : (
					<button onClick={handleFinish}>Finish Workout</button>
				)}
			</div>
		</div>
	);
}

export default TrackerPage;
