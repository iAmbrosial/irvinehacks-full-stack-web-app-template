import { Routes, Route } from "react-router-dom";
import "./App.css";

import HomePage from "@/pages/HomePage";
import TrackerPage from "@/pages/TrackerPage";
import SummaryPage from "@/pages/SummaryPage";
import ExercisesPage from "@/pages/ExercisesPage";
import HelpPage from "@/pages/HelpPage";

// Each page renders its own Nav — App only handles routing.
function App() {
	return (
		<div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/tracker" element={<TrackerPage />} />
				<Route path="/summary" element={<SummaryPage />} />
				<Route path="/exercises" element={<ExercisesPage />} />
				<Route path="/help" element={<HelpPage />} />
			</Routes>
		</div>
	);
}

export default App;
