import { Routes, Route } from "react-router-dom";
import "./App.css";

import HomePage from "@/pages/HomePage";
import TrackerPage from "@/pages/TrackerPage";
import SummaryPage from "@/pages/SummaryPage";
import HelpPage from "@/pages/HelpPage";

/*
App.jsx is the root component of our application.
We use React Router's <Routes> and <Route> to define which page component
renders at each URL path. The <BrowserRouter> wrapper lives in main.jsx.

useState is not needed here — each page manages its own state.
*/
function App() {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/tracker" element={<TrackerPage />} />
			<Route path="/summary" element={<SummaryPage />} />
			<Route path="/help" element={<HelpPage />} />
		</Routes>
	);
}

export default App;
