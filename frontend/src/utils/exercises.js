// static exercise library

export const EXERCISES = [
	{
		id: "Squat",
		name: "Squat",
		muscles: ["Quads", "Glutes", "Hamstrings", "Core"],
		videoId: "my0tLDaWyDU", // "How To Squat Correctly (NO BACK PAIN)" – Squat University
		instructions: [
			"Stand with feet shoulder-width apart, toes slightly out.",
			"Brace your core and keep your chest up.",
			"Push your knees out in line with your toes as you descend.",
			"Lower until thighs are parallel to the floor (or as low as comfortable).",
			"Drive through your heels to stand back up.",
		],
		tips: [
			"Do not let knees cave inward.",
			"Keep heels flat on the floor throughout.",
			"Avoid rounding the lower back.",
			"Keep the bar (or hands) from pulling the torso forward.",
		],
	},
	{
		id: "Forward Lunge",
		name: "Forward Lunge",
		muscles: ["Quads", "Glutes", "Hamstrings", "Calves"],
		videoId: "ASdqJoDPMHA", // "HOW TO DO A LUNGE / LUNGES FOR BEGINNERS" – Fitness for Transformation
		instructions: [
			"Stand tall with feet together.",
			"Step one foot forward roughly two feet.",
			"Lower your back knee toward the floor, keeping front shin vertical.",
			"Both knees should reach about 90 degrees at the bottom.",
			"Push through your front heel to return to standing.",
		],
		tips: [
			"Front knee should not travel past the toes.",
			"Keep your torso upright — do not lean forward.",
			"Back knee should hover just above the floor, not slam into it.",
		],
	},
	{
		id: "Push-Up",
		name: "Push-Up",
		muscles: ["Chest", "Triceps", "Shoulders", "Core"],
		videoId: "IODxDxX7oi4", // "The Perfect Push Up | Do it right!" — Calisthenicmovement
		instructions: [
			"Start in a high plank: hands slightly wider than shoulder-width.",
			"Keep your body in a straight line from head to heels.",
			"Lower your chest to just above the floor by bending your elbows.",
			"Elbows should flare out about 45 degrees, not 90.",
			"Press back up to full arm extension.",
		],
		tips: [
			"Do not let hips sag or pike up.",
			"Keep your core and glutes tight throughout.",
			"Full range of motion: chest nearly touches the floor at the bottom.",
		],
	},
	{
		id: "Plank",
		name: "Plank",
		muscles: ["Core", "Shoulders", "Glutes"],
		videoId: "pSHjTRCQxIw", // "How To: Plank" — ScottHermanFitness
		instructions: [
			"Place forearms on the floor, elbows under shoulders.",
			"Extend legs behind you, resting on toes.",
			"Squeeze glutes and brace core — body forms a straight line.",
			"Hold without letting hips drop or rise.",
		],
		tips: [
			"Do not hold your breath — breathe steadily.",
			"Avoid shrugging your shoulders toward your ears.",
			"Hips should not sag below or pike above the shoulder-to-ankle line.",
		],
	},
];

/*
Lookup helper — used by ExerciseSelector and the LLM prompt builder.
Returns the exercise object for a given id, or null if not found.
*/
export function getExercise(id) {
	return EXERCISES.find((e) => e.id === id) ?? null;
}
