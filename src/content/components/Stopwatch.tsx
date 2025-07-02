import { useEffect, useState } from "react";

const Stopwatch: React.FC = () => {
	const [seconds, setSeconds] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
		return () => clearInterval(interval);
	}, []);

	const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
	const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
	const secs = String(seconds % 60).padStart(2, "0");

	return (
		<span className="contest-state-regular countdown before-contest-2121-finish">
			{hrs}:{mins}:{secs}
		</span>
	);
};

export default Stopwatch;
