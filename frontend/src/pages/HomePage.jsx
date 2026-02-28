import { Link } from "react-router-dom";

/*
HomePage — landing page.
Gives users a quick intro and links to start training or read the docs.
*/
function HomePage() {
	return (
		<div>
			<h1>AI Fitness Coach</h1>
			<p>Real-time posture analysis and form feedback powered by computer vision.</p>
			<nav>
				<Link to="/tracker">Start Training</Link>
				{" | "}
				<Link to="/help">Help & Docs</Link>
			</nav>
		</div>
	);
}

export default HomePage;
