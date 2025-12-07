import { useCallback, useEffect, useRef, useState } from "react";

interface StopwatchProps {
  problemKey: string | null;
  onStatusChange?: (msg: string) => void;
  onAlert?: (msg: string) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds} sec${totalSeconds !== 1 ? 's' : ''}`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min${totalMinutes !== 1 ? 's' : ''}`;
  }

  const totalHours = Math.floor(totalMinutes / 60);
  return `${totalHours} hour${totalHours !== 1 ? 's' : ''}`;
}

const Stopwatch: React.FC<StopwatchProps> = ({ problemKey, onStatusChange, onAlert }) => {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTimeUpdationStopped, setIsTimeUpdationStopped] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const firstSeenTimeRef = useRef<number | null>(null);
  const lastPausedRef = useRef<number | null>(null);
  const totalPauseTimeRef = useRef<number>(0);
  const lastSeenTimeRef = useRef<number>(0);

  const INACTIVITY_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours
  const STORAGE_KEY = problemKey ? `stopwatch_${problemKey}` : null;

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

  const collectCurrentState = () => {
    return {
      startTime: firstSeenTimeRef.current,
      lastPausedTime: lastPausedRef.current,
      totalPauseDuration: totalPauseTimeRef.current,
      isRunning,
      isPaused,
      lastSeen: Date.now(),
    };
  };

  // Save state to localStorage
  const saveStateToStorage = useCallback(() => {
    if (!problemKey || !STORAGE_KEY) return;

    const state = collectCurrentState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [problemKey, isRunning, isPaused, STORAGE_KEY]);

  const loadStateFromStorage = useCallback(() => {
    if (!problemKey || !STORAGE_KEY) return null;

    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (!storedData) return null;

      const state = JSON.parse(storedData);
      return {
        storedStartTime: state.startTime || 0,
        storedLastPausedTime: state.lastPausedTime || 0,
        storedTotalPauseDuration: state.totalPauseDuration || 0,
        storedIsRunning: state.isRunning || false,
        storedIsPaused: state.isPaused || false,
        storedLastSeen: state.lastSeen || 0,
      };
    } catch (error) {
      console.error("[ERROR] Error loading state from storage:", error);
      return null;
    }
  }, [problemKey, STORAGE_KEY]);

  // Intialization logic
  useEffect(() => {
    if (!problemKey) return;

    const {
      storedStartTime,
      storedLastPausedTime,
      storedTotalPauseDuration,
      storedIsRunning,
      storedIsPaused,
      storedLastSeen,
    } = loadStateFromStorage() || {
      storedStartTime: 0,
      storedLastPausedTime: 0,
      storedTotalPauseDuration: 0,
      storedIsRunning: false,
      storedIsPaused: false,
      storedLastSeen: 0,
    };

    if (!storedStartTime) {
      // No previous state
      firstSeenTimeRef.current = null;
      lastPausedRef.current = null;
      totalPauseTimeRef.current = 0;
      lastSeenTimeRef.current = 0;
      setElapsed(0);
      setIsRunning(false);
      setIsPaused(false);
      return;
    }

    // Restore previous state
    firstSeenTimeRef.current = storedStartTime;
    lastPausedRef.current = storedLastPausedTime || null;
    totalPauseTimeRef.current = storedTotalPauseDuration;
    lastSeenTimeRef.current = storedLastSeen;

    const currentTime = Date.now();
    const inactiveTime = currentTime - storedLastSeen;
    let currentElapsed = 0;
    if (storedIsPaused && storedLastPausedTime) {
      // If paused, calculate elapsed time = (lastPaused - start) - totalPauseDuration
      currentElapsed = storedLastPausedTime - storedStartTime - storedTotalPauseDuration;
    } else if (storedIsRunning) {
      // If running, calculate elapsed time  = (now - start) - totalPauseDuration
      currentElapsed = currentTime - storedStartTime - storedTotalPauseDuration;
    }
    currentElapsed = Math.max(0, currentElapsed);
    setElapsed(currentElapsed);

    // Inactivity check
    if (storedStartTime && storedLastSeen && inactiveTime > INACTIVITY_THRESHOLD) {
      if (intervalRef.current)
        clearInterval(intervalRef.current!);
      intervalRef.current = null;
      setIsTimeUpdationStopped(true);
      const alertStartTime = Date.now();

      let promptMessage = '';
      if (storedIsPaused) {
        promptMessage = `You had paused the stopwatch at: ${formatTime(currentElapsed)}\n\nIt's been over ${formatDuration(INACTIVITY_THRESHOLD)} since then.`;
      } else {
        promptMessage =
          `You've been away for over ${formatDuration(INACTIVITY_THRESHOLD)}.\n\nTime spent so far: ${formatTime(currentElapsed)}`
      }

      promptMessage += `\nDo you want to continue from where you left off?\n\nClick "OK" to continue or "Cancel" to reset the timer. (Timer paused while waiting for your response)`;

      // THIS IS A BLOCKING CALL
      const confirmed = window.confirm(promptMessage);
      const alertShownDuration = Date.now() - alertStartTime;
      setIsTimeUpdationStopped(false);

      if (confirmed) {
        if (storedIsPaused) {
          setIsRunning(false);
          setIsPaused(true);
        } else {
          totalPauseTimeRef.current += alertShownDuration;
          setIsRunning(true);
          setIsPaused(false);
        }
      } else {
        handleReset();
      }
      return;
    }

    if (storedIsRunning && !storedIsPaused) {
      // Stopwatch was RUNNING - add inactive time to pause duration
      setIsRunning(true);
      setIsPaused(false);
    } else if (storedIsPaused && lastPausedRef.current) {
      // was PAUSED - keep the elapsed time as it was when paused
      setIsRunning(false);
      setIsPaused(true);
    } else {
      // STOPPED state
      setIsRunning(false);
      setIsPaused(false);
    }
  }, [problemKey]);

  // Notification thresholds
  const NOTIFICATIONS = [
    { time: 15000, message: "Hint is available" },
    { time: 30000, message: "Editorial is available" },
    { time: 60000, message: "Check Solution" },
  ];

  // Handle timer updates and notifications
  useEffect(() => {
    if (!isTimeUpdationStopped && isRunning && !isPaused) {
      if (intervalRef.current)
        clearInterval(intervalRef.current!);
      intervalRef.current = window.setInterval(() => {
        if (!firstSeenTimeRef.current) return;

        const currentTime = Date.now();
        const totalElapsed = currentTime - firstSeenTimeRef.current - totalPauseTimeRef.current;
        const newElapsed = Math.max(0, totalElapsed);
        
        setElapsed(newElapsed);

        // Check for notifications
        NOTIFICATIONS.forEach(note => {
          // Trigger if we just crossed the threshold (within last 100ms tick)
          if (newElapsed >= note.time && newElapsed - 100 < note.time) {
             // We need a way to signal parent. 
             // Since we can't easily add props without breaking interface in this tool call,
             // I will dispatch a custom event for now, or I should have updated the interface first.
             // Actually, I'll update the interface in the next step or use a custom event.
             // Let's use a custom event for decoupling if I can't change props easily in one go.
             // But changing props is better. I'll assume I can update the parent in the next step.
             // For this file, I'll add the prop to the interface.
             if (onStatusChange) onStatusChange(note.message);
             if (onAlert) onAlert(note.message);
          }
        });

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
  }, [isRunning, isPaused, isTimeUpdationStopped]);

  // Auto-pause logic
  useEffect(() => {
    if (!isRunning || isPaused || !problemKey) return;

    const checkSubmission = async () => {
      try {
        // Extract contestId and index from problemKey (format: contestId-index)
        // problemKey is like "1234-A"
        const [contestId, index] = problemKey.split("-");
        if (!contestId || !index) return;

        // We need the handle. Assuming we can get it from DOM or storage.
        // For now, let's try to find it in the DOM as we did in useStrongWeakAnalysis
        const handleLink = document.querySelector("#header a[href^='/profile/']");
        const handle = handleLink ? (handleLink as HTMLElement).innerText : null;

        if (!handle) return;

        const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=5`);
        const data = await res.json();
        if (data.status === "OK") {
          const solved = data.result.some((sub: any) => 
            sub.contestId == contestId && 
            sub.problem.index == index && 
            sub.verdict === "OK"
          );

          if (solved) {
            handlePauseResume(); // Pause
            if (onStatusChange) onStatusChange("Problem Solved!");
            alert("Problem Solved! Timer paused.");
          }
        }
      } catch (e) {
        console.error("Auto-pause check failed", e);
      }
    };

    const pollInterval = setInterval(checkSubmission, 60000); // Check every minute
    return () => clearInterval(pollInterval);
  }, [isRunning, isPaused, problemKey]);

  // Save state periodically
  useEffect(() => {
    if (!isRunning || isPaused || isTimeUpdationStopped) return;

    const saveInterval = window.setInterval(saveStateToStorage, 500);
    return () => clearInterval(saveInterval);
  }, [isRunning, isPaused, isTimeUpdationStopped, saveStateToStorage]);

  // Save state on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isTimeUpdationStopped) return;
      saveStateToStorage();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveStateToStorage]);

  // Pause/Resume handler
  const handlePauseResume = () => {
    if (!problemKey) return;

    const currentTime = Date.now();

    if (!isRunning || isPaused) {
      // Starting for the first time or resuming
      if (!firstSeenTimeRef.current) {
        firstSeenTimeRef.current = currentTime;
      }

      if (isPaused && lastPausedRef.current) {
        // Resuming from pause
        totalPauseTimeRef.current += currentTime - lastPausedRef.current;
        lastPausedRef.current = null;
      }

      setIsRunning(true);
      setIsPaused(false);
    } else {
      // Pausing
      lastPausedRef.current = currentTime;
      setIsPaused(true);
      setIsRunning(false);

      // calculate and set current elapsed time when pausing
      if (firstSeenTimeRef.current) {
        const totalElapsed = currentTime - firstSeenTimeRef.current - totalPauseTimeRef.current;
        setElapsed(Math.max(0, totalElapsed));
      }
    }
  };

  const handleReset = () => {
    if (!problemKey) return;

    firstSeenTimeRef.current = null;
    lastPausedRef.current = null;
    totalPauseTimeRef.current = 0;
    lastSeenTimeRef.current = 0;
    setElapsed(0);
    setIsRunning(false);
    setIsPaused(false);

    if (STORAGE_KEY) localStorage.removeItem(STORAGE_KEY);
  };

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
              {formatTime(elapsed)} {isPaused ? "(Paused)" : ""}
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
            aria-label={isRunning && !isPaused ? "Pause" : "Resume"}
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
