import { NavLink } from "react-router-dom";

/*
Navbar — persistent top navigation bar shown on every page.
*/
function Navbar() {
	const linkStyle = ({ isActive }) => ({
		color: isActive ? "#d4ff70" : "white",
		fontWeight: isActive ? "bold" : "normal",
		textDecoration: "none",
		marginRight: "24px",
	});

	return (
		<nav style={{
			width: "100%",
			backgroundColor: "#111",
			padding: "12px 24px",
			display: "flex",
			alignItems: "center",
			gap: "8px",
			boxSizing: "border-box",
		}}>
			<span style={{ color: "#d4ff70", fontWeight: "bold", marginRight: "32px" }}>
				AI Fitness Coach
			</span>
			<NavLink to="/" style={linkStyle} end>Home</NavLink>
			<NavLink to="/tracker" style={linkStyle}>Tracker</NavLink>
			<NavLink to="/help" style={linkStyle}>Help</NavLink>
			<NavLink to="/summary" style={linkStyle}>Summary</NavLink>
		</nav>
	);
}

export default Navbar;
