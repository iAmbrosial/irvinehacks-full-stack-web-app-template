import { Routes, Route } from "react-router-dom";
import "./App.css";

import Nav from "@/components/layout/Nav";
import HomePage from "@/pages/HomePage";
import TrackerPage from "@/pages/TrackerPage";
import SummaryPage from "@/pages/SummaryPage";
import ExercisesPage from "@/pages/ExercisesPage";
import HelpPage from "@/pages/HelpPage";
function App() {
	return (
		<div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
			
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/tracker" element={<TrackerPage />} />
				<Route path="/summary" element={<SummaryPage />} />
				<Route path="/help" element={<HelpPage />} />
				<Route path = "/exercises" element = {<ExercisesPage/>} />
				<Route path = "/help" element = {<HelpPage />} />
			</Routes>
		</div>
	);
}

export default App;
