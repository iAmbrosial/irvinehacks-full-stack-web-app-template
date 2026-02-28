import { EXERCISES } from "@/utils/exercises";

// dropdown that lets the user pick their next exercise
function ExerciseSelector({ value, onChange, disabled }) {
	return (
		<div>
			<label htmlFor="exercise-select">Exercise: </label>
			<select
				id="exercise-select"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				// locks the exercise selector while a session is in progress
				disabled={disabled}
			>
				{EXERCISES.map((ex) => (
					<option key={ex.id} value={ex.id}>
						{ex.name}
					</option>
				))}
			</select>
		</div>
	);
}

export default ExerciseSelector;
