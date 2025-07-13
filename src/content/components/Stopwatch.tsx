import React, { useEffect, useRef, useState } from "react";

const STORAGE_KEY_START = "cfMentorStopwatchStartTime";
const STORAGE_KEY_ACC = "cfMentorStopwatchAccumulatedTime";
const STORAGE_KEY_RUNNING = "cfMentorStopwatchRunning";

const Stopwatch: React.FC = () => {
	const [elapsed, setElapsed] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const intervalRef = useRef<number | null>(null);
	const accumulatedTimeRef = useRef<number>(0);
	const startTimeRef = useRef<number>(0);

	// Initialize on mount
	useEffect(() => {
		const storedAcc = parseInt(localStorage.getItem(STORAGE_KEY_ACC) || "0");
		const storedRunning = localStorage.getItem(STORAGE_KEY_RUNNING) === "true";
		const storedStart = parseInt(
			localStorage.getItem(STORAGE_KEY_START) || "0",
		);

		accumulatedTimeRef.current = storedAcc;
		setElapsed(storedAcc);

		if (storedRunning && storedStart) {
			// Calculate time passed since last start
			const timePassed = Date.now() - storedStart;
			const newTotal = storedAcc + timePassed;
			accumulatedTimeRef.current = newTotal;
			setElapsed(newTotal);
			setIsRunning(true);
		}
	}, []);

	// Handle timer logic
	useEffect(() => {
		if (isRunning) {
			startTimeRef.current = Date.now();
			localStorage.setItem(STORAGE_KEY_START, startTimeRef.current.toString());
			localStorage.setItem(STORAGE_KEY_RUNNING, "true");

			intervalRef.current = window.setInterval(() => {
				const now = Date.now();
				const sessionTime = now - startTimeRef.current;
				const totalTime = accumulatedTimeRef.current + sessionTime;
				setElapsed(totalTime);
			}, 100);
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			localStorage.setItem(STORAGE_KEY_RUNNING, "false");
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [isRunning]);

	const handlePauseResume = () => {
		if (isRunning) {
			// Pausing: save current elapsed time as accumulated
			accumulatedTimeRef.current = elapsed;
			localStorage.setItem(STORAGE_KEY_ACC, elapsed.toString());
		}
		setIsRunning((prev) => !prev);
	};

	const handleReset = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		accumulatedTimeRef.current = 0;
		startTimeRef.current = 0;

		localStorage.setItem(STORAGE_KEY_START, "0");
		localStorage.setItem(STORAGE_KEY_ACC, "0");
		// Don't change the running state - keep it as it was

		setElapsed(0);
		// Don't change isRunning state - it stays the same
	};

	const totalSeconds = Math.floor(elapsed / 1000);
	const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
	const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
	const secs = String(totalSeconds % 60).padStart(2, "0");

	// CSS Reset object to override any inherited styles
	const resetStyles = {
		all: "unset" as const,
		boxSizing: "border-box" as const,
		fontFamily: "inherit",
		fontSize: "inherit",
		lineHeight: "normal",
		textAlign: "left" as const,
		textDecoration: "none",
		textTransform: "none",
		letterSpacing: "normal",
		wordSpacing: "normal",
		whiteSpace: "normal",
		direction: "ltr" as const,
		unicodeBidi: "normal",
		verticalAlign: "baseline",
		background: "transparent",
		border: "none",
		borderRadius: "0",
		outline: "none",
		boxShadow: "none",
		margin: "0",
		padding: "0",
		position: "static" as const,
		display: "inline",
		visibility: "visible",
		overflow: "visible",
		zIndex: "auto",
		opacity: "1",
		transform: "none",
		transition: "none",
		animation: "none",
		cursor: "default",
		userSelect: "auto" as const,
		pointerEvents: "auto" as const,
		touchAction: "auto",
		willChange: "auto",
		backfaceVisibility: "visible" as const,
		perspective: "none",
		transformStyle: "flat" as const,
		isolation: "auto" as const,
		mixBlendMode: "normal" as const,
		objectFit: "fill" as const,
		objectPosition: "50% 50%",
		imageRendering: "auto" as const,
		color: "inherit",
		font: "inherit",
		fontStyle: "normal",
		fontVariant: "normal",
		fontWeight: "normal",
		fontStretch: "normal",
		fontFeatureSettings: "normal",
		fontKerning: "auto",
		textRendering: "auto",
	};

	return (
		<div
			style={{
				...resetStyles,
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				background: "transparent",
				padding: "0px",
				fontFamily: "inherit",
				fontSize: "inherit",
				isolation: "isolate",
				position: "relative",
				zIndex: 999999,
				contain: "layout style paint",
				WebkitFontSmoothing: "antialiased",
				MozOsxFontSmoothing: "grayscale",
			}}
		>
			{/* Left Div */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flex: 1,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<span className="contest-state-regular countdown before-contest-2121-finish">
						{hrs}:{mins}:{secs}
					</span>
				</div>
			</div>

			{/* Right Div */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "4px",
				}}
			>
				<button
					onClick={handlePauseResume}
					aria-label={isRunning ? "Pause" : "Resume"}
					style={{
						...resetStyles,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: "36px",
						height: "36px",
						padding: "8px",
						border: "none",
						borderRadius: "6px",
						background: "transparent",
						cursor: "pointer",
						transition: "background-color 0.2s ease",
						color: "#3B5998",
						outline: "none",
						boxShadow: "none",
						WebkitAppearance: "none",
						MozAppearance: "none",
						appearance: "none",
						userSelect: "none",
						WebkitUserSelect: "none",
						MozUserSelect: "none",
						msUserSelect: "none",
						WebkitTapHighlightColor: "transparent",
					}}
				>
					{isRunning ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="#3B5998"
							style={{
								display: "block",
								pointerEvents: "none",
								userSelect: "none",
								WebkitUserSelect: "none",
								MozUserSelect: "none",
								msUserSelect: "none",
							}}
						>
							<rect x="6" y="4" width="4" height="16" />
							<rect x="14" y="4" width="4" height="16" />
						</svg>
					) : (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="#3B5998"
							style={{
								display: "block",
								pointerEvents: "none",
								userSelect: "none",
								WebkitUserSelect: "none",
								MozUserSelect: "none",
								msUserSelect: "none",
							}}
						>
							<path d="M8 5v14l11-7z" />
						</svg>
					)}
				</button>

				<button
					onClick={handleReset}
					aria-label="Reset"
					style={{
						...resetStyles,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: "36px",
						height: "36px",
						padding: "8px",
						border: "none",
						borderRadius: "6px",
						background: "transparent",
						cursor: "pointer",
						transition: "background-color 0.2s ease",
						color: "#3B5998",
						outline: "none",
						boxShadow: "none",
						WebkitAppearance: "none",
						MozAppearance: "none",
						appearance: "none",
						userSelect: "none",
						WebkitUserSelect: "none",
						MozUserSelect: "none",
						msUserSelect: "none",
						WebkitTapHighlightColor: "transparent",
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="#3B5998"
						style={{
							display: "block",
							pointerEvents: "none",
							userSelect: "none",
							WebkitUserSelect: "none",
							MozUserSelect: "none",
							msUserSelect: "none",
						}}
					>
						<path d="M12 5V1L8 5l4 4V6c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6H4c0 4.411 3.589 8 8 8s8-3.589 8-8-3.589-8-8-8z" />
					</svg>
				</button>
			</div>
		</div>
	);
};

export default Stopwatch;
