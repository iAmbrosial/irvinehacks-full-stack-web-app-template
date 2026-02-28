import { Link } from "react-router-dom";

/*
HelpPage — exercise library and documentation.
Will contain step-by-step exercise instructions and embedded video examples.
*/
function HelpPage() {
	return (
		<div>
			<h1>Help & Documentation</h1>
			<p>Exercise guides coming soon.</p>
			<Link to="/">Back to Home</Link>
		</div>
	);
}

export default HelpPage;
