import { Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar from "@/components/layout/Navbar";
import HomePage from "@/pages/HomePage";
import TrackerPage from "@/pages/TrackerPage";
import SummaryPage from "@/pages/SummaryPage";
import HelpPage from "@/pages/ExercisesPage";
import ExercisesPage from "@/pages/ExercisesPage";
/*
App.jsx is the root component of our application.
Navbar sits outside <Routes> so it renders on every page.
We use React Router's <Routes> and <Route> to define which page component
renders at each URL path. The <BrowserRouter> wrapper lives in main.jsx.
*/
function App() {
	return (
		<div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
			
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/tracker" element={<TrackerPage />} />
				<Route path="/summary" element={<SummaryPage />} />
				<Route path="/help" element={<HelpPage />} />
				<Route path = "/exercises" element = {<ExercisesPage/>} />
			</Routes>
		</div>
	);
}

export default App;
