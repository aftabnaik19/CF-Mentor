import { useCallback, useEffect, useRef, useState } from "react";

interface StopwatchProps {
	problemKey: string | null;
}

interface ConfirmationPopupProps {
	isOpen: boolean;
	timeSpent: string;
	onContinue: () => void;
	onReset: () => void;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
	isOpen,
	timeSpent,
	onContinue,
	onReset,
}) => {
	if (!isOpen) return null;

	const resetStyles = {
		all: "unset" as const,
		boxSizing: "border-box" as const,
		fontFamily: "inherit",
		fontSize: "inherit",
	};

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: "rgba(0, 0, 0, 0.5)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1000000,
			}}
		>
			<div
				style={{
					backgroundColor: "white",
					padding: "24px",
					borderRadius: "8px",
					boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
					maxWidth: "400px",
					width: "90%",
					textAlign: "center",
				}}
			>
				<h3
					style={{
						...resetStyles,
						margin: "0 0 16px 0",
						fontSize: "18px",
						fontWeight: "600",
						color: "#333",
					}}
				>
					Continue Previous Session?
				</h3>
				<p
					style={{
						...resetStyles,
						margin: "0 0 24px 0",
						fontSize: "14px",
						color: "#666",
						lineHeight: "1.5",
					}}
				>
					You previously spent <strong>{timeSpent}</strong> on this problem.
					<br />
					Would you like to continue from where you left or reset the timer?
				</p>
				<div
					style={{
						display: "flex",
						gap: "12px",
						justifyContent: "center",
					}}
				>
					<button
						onClick={onContinue}
						style={{
							...resetStyles,
							padding: "8px 16px",
							backgroundColor: "#3B5998",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
							fontSize: "14px",
							fontWeight: "500",
						}}
					>
						Continue
					</button>
					<button
						onClick={onReset}
						style={{
							...resetStyles,
							padding: "8px 16px",
							backgroundColor: "#dc3545",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
							fontSize: "14px",
							fontWeight: "500",
						}}
					>
						Reset
					</button>
				</div>
			</div>
		</div>
	);
};

const Stopwatch: React.FC<StopwatchProps> = ({ problemKey }) => {
	const [elapsed, setElapsed] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [showConfirmation, setShowConfirmation] = useState(false);

	const intervalRef = useRef<number | null>(null);
	const firstSeenTimeRef = useRef<number | null>(null);
	const lastPausedRef = useRef<number | null>(null);
	const totalPauseTimeRef = useRef<number>(0);
	const lastSeenRef = useRef<number>(0);
	const isHandlingRef = useRef<boolean>(false);

	// Constants for inactivity threshold (2 hours in milliseconds)
	const INACTIVITY_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours

	// Storage keys
	const STORAGE_KEY_FIRST_SEEN = problemKey
		? `cfMentorStopwatch_firstSeen_${problemKey}`
		: null;
	const STORAGE_KEY_LAST_PAUSED = problemKey
		? `cfMentorStopwatch_lastPaused_${problemKey}`
		: null;
	const STORAGE_KEY_TOTAL_PAUSE = problemKey
		? `cfMentorStopwatch_totalPause_${problemKey}`
		: null;
	const STORAGE_KEY_IS_RUNNING = problemKey
		? `cfMentorStopwatch_isRunning_${problemKey}`
		: null;
	const STORAGE_KEY_IS_PAUSED = problemKey
		? `cfMentorStopwatch_isPaused_${problemKey}`
		: null;
	const STORAGE_KEY_LAST_SEEN = problemKey
		? `cfMentorStopwatch_lastSeen_${problemKey}`
		: null;

	// Function to calculate elapsed time
	const calculateElapsedTime = useCallback(() => {
		if (!firstSeenTimeRef.current) return 0;

		const currentTime = Date.now();
		let totalElapsed =
			currentTime - firstSeenTimeRef.current - totalPauseTimeRef.current;

		// If currently paused, subtract the current pause duration
		if (isPaused && lastPausedRef.current) {
			totalElapsed -= currentTime - lastPausedRef.current;
		}

		return Math.max(0, totalElapsed);
	}, [isPaused]);

	// Function to format time for display
	const formatTime = (timeMs: number): string => {
		const totalSeconds = Math.floor(timeMs / 1000);
		const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
		const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
			2,
			"0",
		);
		const secs = String(totalSeconds % 60).padStart(2, "0");
		return `${hrs}:${mins}:${secs}`;
	};

	// Save state to localStorage
	const saveStateToStorage = useCallback(() => {
		if (!problemKey) return;

		if (STORAGE_KEY_FIRST_SEEN) {
			localStorage.setItem(
				STORAGE_KEY_FIRST_SEEN,
				(firstSeenTimeRef.current || 0).toString(),
			);
		}
		if (STORAGE_KEY_LAST_PAUSED) {
			localStorage.setItem(
				STORAGE_KEY_LAST_PAUSED,
				(lastPausedRef.current || 0).toString(),
			);
		}
		if (STORAGE_KEY_TOTAL_PAUSE) {
			localStorage.setItem(
				STORAGE_KEY_TOTAL_PAUSE,
				totalPauseTimeRef.current.toString(),
			);
		}
		if (STORAGE_KEY_IS_RUNNING) {
			localStorage.setItem(STORAGE_KEY_IS_RUNNING, isRunning.toString());
		}
		if (STORAGE_KEY_IS_PAUSED) {
			localStorage.setItem(STORAGE_KEY_IS_PAUSED, isPaused.toString());
		}
		if (STORAGE_KEY_LAST_SEEN) {
			localStorage.setItem(STORAGE_KEY_LAST_SEEN, Date.now().toString());
		}
	}, [
		problemKey,
		isRunning,
		isPaused,
		STORAGE_KEY_FIRST_SEEN,
		STORAGE_KEY_IS_PAUSED,
		STORAGE_KEY_IS_RUNNING,
		STORAGE_KEY_LAST_PAUSED,
		STORAGE_KEY_LAST_SEEN,
		STORAGE_KEY_TOTAL_PAUSE,
	]);

	// Load state from localStorage
	const loadStateFromStorage = useCallback(() => {
		if (!problemKey) return;

		const storedFirstSeen = STORAGE_KEY_FIRST_SEEN
			? parseInt(localStorage.getItem(STORAGE_KEY_FIRST_SEEN) || "0")
			: 0;
		const storedLastPaused = STORAGE_KEY_LAST_PAUSED
			? parseInt(localStorage.getItem(STORAGE_KEY_LAST_PAUSED) || "0")
			: 0;
		const storedTotalPause = STORAGE_KEY_TOTAL_PAUSE
			? parseInt(localStorage.getItem(STORAGE_KEY_TOTAL_PAUSE) || "0")
			: 0;
		const storedIsRunning = STORAGE_KEY_IS_RUNNING
			? localStorage.getItem(STORAGE_KEY_IS_RUNNING) === "true"
			: false;
		const storedIsPaused = STORAGE_KEY_IS_PAUSED
			? localStorage.getItem(STORAGE_KEY_IS_PAUSED) === "true"
			: false;
		const storedLastSeen = STORAGE_KEY_LAST_SEEN
			? parseInt(localStorage.getItem(STORAGE_KEY_LAST_SEEN) || "0")
			: 0;

		firstSeenTimeRef.current = storedFirstSeen || null;
		lastPausedRef.current = storedLastPaused || null;
		totalPauseTimeRef.current = storedTotalPause;
		lastSeenRef.current = storedLastSeen;

		return {
			storedIsRunning,
			storedIsPaused,
			storedLastSeen,
			storedFirstSeen,
		};
	}, [
		problemKey,
		STORAGE_KEY_FIRST_SEEN,
		STORAGE_KEY_IS_PAUSED,
		STORAGE_KEY_IS_RUNNING,
		STORAGE_KEY_LAST_PAUSED,
		STORAGE_KEY_LAST_SEEN,
		STORAGE_KEY_TOTAL_PAUSE,
	]);

	// Initialize component
	useEffect(() => {
		if (!problemKey) return;

		const state = loadStateFromStorage();
		if (!state) return;
		const currentTime = Date.now();

		// Check if user was inactive for too long
		if (
			state.storedLastSeen &&
			state.storedFirstSeen &&
			currentTime - state.storedLastSeen > INACTIVITY_THRESHOLD
		) {
			const timeSpentBeforeInactivity =
				state.storedLastSeen -
				state.storedFirstSeen -
				totalPauseTimeRef.current;
			setShowConfirmation(true);
			setElapsed(timeSpentBeforeInactivity);
			return;
		}

		// Restore previous state
		if (state.storedIsRunning) {
			setIsRunning(true);
			setIsPaused(false);
		} else {
			setIsRunning(state.storedIsRunning);
			setIsPaused(state.storedIsPaused);
		}

		// FIXED: Handle the case where stopwatch was running during reload
		if (state.storedIsRunning && !state.storedIsPaused) {
			// If the stopwatch was running, we need to account for the time that passed during reload
			// The key insight is that we don't need to add pause time since it was running
			// The calculateElapsedTime() function will handle this correctly
			setElapsed(calculateElapsedTime());
		} else if (state.storedIsPaused && lastPausedRef.current) {
			// If was paused, add the pause time that accumulated during absence
			totalPauseTimeRef.current += currentTime - lastPausedRef.current;
			lastPausedRef.current = currentTime;
			setElapsed(calculateElapsedTime());
		} else {
			// Calculate and set current elapsed time for other states
			setElapsed(calculateElapsedTime());
		}
	}, [problemKey, INACTIVITY_THRESHOLD, calculateElapsedTime, loadStateFromStorage]);

	// Handle timer updates
	useEffect(() => {
		if (isRunning && !isPaused) {
			intervalRef.current = window.setInterval(() => {
				setElapsed(calculateElapsedTime());
			}, 100);
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [isRunning, isPaused, calculateElapsedTime]);

	// Save state when component unmounts or key changes
	useEffect(() => {
		return () => {
			saveStateToStorage();
		};
	}, [problemKey, isRunning, isPaused, saveStateToStorage]);

	// Handle beforeunload to save state
	useEffect(() => {
		const handleBeforeUnload = () => {
			saveStateToStorage();
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [saveStateToStorage]);

	// FIXED: Update elapsed time immediately when state changes
	useEffect(() => {
		// Update elapsed time whenever isRunning or isPaused changes
		setElapsed(calculateElapsedTime());
	}, [isRunning, isPaused, calculateElapsedTime]);

	// Handle play/pause button
	const handlePauseResume = () => {
		if (!problemKey || isHandlingRef.current) return;

		isHandlingRef.current = true;
		setTimeout(() => (isHandlingRef.current = false), 200);

		const currentTime = Date.now();

		if (!isRunning) {
			// Starting for the first time or resuming
			if (!firstSeenTimeRef.current) {
				firstSeenTimeRef.current = currentTime;
			}

			if (isPaused && lastPausedRef.current) {
				// Resuming from pause
				totalPauseTimeRef.current += currentTime - lastPausedRef.current;
				lastPausedRef.current = null;
				setIsPaused(false);
			}

			setIsRunning(true);
			setIsPaused(false);
		} else {
			// Pausing
			lastPausedRef.current = currentTime;
			setIsPaused(true);
			setIsRunning(false);
		}

		saveStateToStorage();
	};

	// Handle reset button
	const handleReset = () => {
		if (!problemKey) return;

		// Clear all state
		firstSeenTimeRef.current = null;
		lastPausedRef.current = null;
		totalPauseTimeRef.current = 0;
		setElapsed(0);
		setIsRunning(false);
		setIsPaused(false);

		// Clear localStorage
		if (STORAGE_KEY_FIRST_SEEN) localStorage.removeItem(STORAGE_KEY_FIRST_SEEN);
		if (STORAGE_KEY_LAST_PAUSED)
			localStorage.removeItem(STORAGE_KEY_LAST_PAUSED);
		if (STORAGE_KEY_TOTAL_PAUSE)
			localStorage.removeItem(STORAGE_KEY_TOTAL_PAUSE);
		if (STORAGE_KEY_IS_RUNNING) localStorage.removeItem(STORAGE_KEY_IS_RUNNING);
		if (STORAGE_KEY_IS_PAUSED) localStorage.removeItem(STORAGE_KEY_IS_PAUSED);
		if (STORAGE_KEY_LAST_SEEN) localStorage.removeItem(STORAGE_KEY_LAST_SEEN);
	};

	// Handle confirmation popup actions
	const handleContinue = () => {
		setShowConfirmation(false);
		const state = loadStateFromStorage();
		if (!state) return;
		setIsRunning(state.storedIsRunning);
		setIsPaused(state.storedIsPaused);
		setElapsed(calculateElapsedTime());
		saveStateToStorage();
	};

	const handleResetFromPopup = () => {
		setShowConfirmation(false);
		handleReset();
	};

	// CSS Reset object
	const resetStyles = {
		all: "unset" as const,
		boxSizing: "border-box" as const,
		fontFamily: "inherit",
		fontSize: "inherit",
		lineHeight: "normal",
		textAlign: "left" as const,
		textDecoration: "none",
		textTransform: "none" as const,
		letterSpacing: "normal",
		wordSpacing: "normal",
		whiteSpace: "normal",
		direction: "ltr" as const,
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
		visibility: "visible" as const,
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
	};

	return (
		<>
			<ConfirmationPopup
				isOpen={showConfirmation}
				timeSpent={formatTime(elapsed)}
				onContinue={handleContinue}
				onReset={handleResetFromPopup}
			/>

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
				{/* Left Div - Timer Display */}
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
							{formatTime(elapsed)}
						</span>
					</div>
				</div>

				{/* Right Div - Control Buttons */}
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
						{isRunning && !isPaused ? (
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
		</>
	);
};

export default Stopwatch;