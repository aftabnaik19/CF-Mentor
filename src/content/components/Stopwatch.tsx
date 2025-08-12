import { useState, useEffect, useCallback, FC } from "react";

// --- Utility Functions & Types ---

interface TimerState {
	isRunning: boolean;
	elapsedTime: number;
	startTime: number;
	lastSeen: number;
}

const formatTime = (timeMs: number): string => {
	const totalSeconds = Math.floor(timeMs / 1000);
	const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
	const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
	const secs = String(totalSeconds % 60).padStart(2, "0");
	return `${hrs}:${mins}:${secs}`;
};

// --- 1. The Custom Hook: useStopwatch ---

const useStopwatch = (problemKey: string | null) => {
	const getInitialState = (): TimerState => ({
		isRunning: false,
		elapsedTime: 0,
		startTime: 0,
		lastSeen: Date.now(),
	});

	const [timerState, setTimerState] = useState<TimerState>(getInitialState());
	const [displayTime, setDisplayTime] = useState<number>(0);

	const STORAGE_KEY = problemKey ? `stopwatch_state_${problemKey}` : null;
	const INACTIVITY_THRESHOLD = 20* 1000; // 2 hours

	const handleReset = useCallback(() => {
		if (STORAGE_KEY) {
			localStorage.removeItem(STORAGE_KEY);
		}
		setTimerState(getInitialState());
		setDisplayTime(0);
	}, [STORAGE_KEY]);

	// Effect for Initialization from localStorage
	useEffect(() => {
		if (!STORAGE_KEY) return;

		try {
			const savedStateJSON = localStorage.getItem(STORAGE_KEY);
			if (!savedStateJSON) return;

			const savedState: TimerState = JSON.parse(savedStateJSON);
			const now = Date.now();
			const wasInactive = now - savedState.lastSeen > INACTIVITY_THRESHOLD;

			if (wasInactive) {
				// Pause the timer state to show the last recorded time
				const pausedState = { ...savedState, isRunning: false };
				setTimerState(pausedState);
				setDisplayTime(pausedState.elapsedTime);
				
				// Use the native browser confirm dialog
				const timeSpent = formatTime(savedState.elapsedTime);
				const userWantsToContinue = window.confirm(
					`You previously spent ${timeSpent} on this problem.\n\nClick OK to continue, or Cancel to reset the timer.`
				);

				if (!userWantsToContinue) {
					handleReset();
				}
			} else {
				// If not inactive, restore state, accounting for time passed if it was running.
				let newElapsedTime = savedState.elapsedTime;
				if (savedState.isRunning) {
					newElapsedTime += now - savedState.lastSeen;
				}
				setTimerState({ ...savedState, elapsedTime: newElapsedTime });
			}
		} catch (error) {
			console.error("Failed to load or parse stopwatch state:", error);
			setTimerState(getInitialState());
		}
	// `handleReset` is stable and included for the linter.
	}, [problemKey, STORAGE_KEY, INACTIVITY_THRESHOLD, handleReset]);

	// Effect for Saving State to localStorage
	useEffect(() => {
		if (!STORAGE_KEY || !timerState) return;
		const stateToSave = { ...timerState, lastSeen: Date.now() };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
	}, [timerState, STORAGE_KEY]);

	// Effect for the Timer Interval (the "tick")
	useEffect(() => {
		let intervalId: number | undefined;

		if (timerState.isRunning) {
			intervalId = window.setInterval(() => {
				const now = Date.now();
				setDisplayTime(timerState.elapsedTime + (now - timerState.startTime));
			}, 100);
		} else {
			setDisplayTime(timerState.elapsedTime);
		}

		return () => clearInterval(intervalId);
	}, [timerState.isRunning, timerState.startTime, timerState.elapsedTime]);

	const handlePlayPause = useCallback(() => {
		const now = Date.now();
		setTimerState((prev) => ({
			...prev,
			isRunning: !prev.isRunning,
			startTime: !prev.isRunning ? now : 0,
			elapsedTime: prev.isRunning ? prev.elapsedTime + (now - prev.startTime) : prev.elapsedTime,
		}));
	}, []);

	return {
		formattedTime: formatTime(displayTime),
		isRunning: timerState.isRunning,
		handlePlayPause,
		handleReset,
	};
};


// --- 2. The Main Stopwatch Component ---

interface StopwatchProps {
	problemKey: string | null;
}

const Stopwatch: FC<StopwatchProps> = ({ problemKey }) => {
	const {
		formattedTime,
		isRunning,
		handlePlayPause,
		handleReset,
	} = useStopwatch(problemKey);
    
	const resetStyles = { all: "unset" as const, boxSizing: "border-box" as const };

	return (
        // The ConfirmationPopup is no longer needed.
		<div
			style={{
				...resetStyles, display: "flex", alignItems: "center",
				justifyContent: "space-between", fontFamily: "inherit",
			}}
		>
			{/* Timer Display */}
			<div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
				<span className="contest-state-regular countdown">
					{formattedTime}
				</span>
			</div>

			{/* Control Buttons */}
			<div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
				<button
					onClick={handlePlayPause}
					aria-label={isRunning ? "Pause" : "Play"}
					style={{ ...resetStyles, display: 'flex', alignItems: 'center', justifyContent: 'center', width: "36px", height: "36px", cursor: "pointer", borderRadius: "6px" }}
				>
					{isRunning ? (
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#3B5998">
							<rect x="6" y="4" width="4" height="16" />
							<rect x="14" y="4" width="4" height="16" />
						</svg>
					) : (
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#3B5998">
							<path d="M8 5v14l11-7z" />
						</svg>
					)}
				</button>

				<button
					onClick={handleReset}
					aria-label="Reset"
					style={{ ...resetStyles, display: 'flex', alignItems: 'center', justifyContent: 'center', width: "36px", height: "36px", cursor: "pointer", borderRadius: "6px" }}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#3B5998">
						<path d="M12 5V1L8 5l4 4V6c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6H4c0 4.411 3.589 8 8 8s8-3.589 8-8-3.589-8-8-8z" />
					</svg>
				</button>
			</div>
		</div>
	);
};

export default Stopwatch;
