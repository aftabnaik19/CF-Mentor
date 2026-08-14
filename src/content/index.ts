/* eslint-disable simple-import-sort/imports */
import "primereact/resources/primereact.min.css"; // core styles
import "primeicons/primeicons.css";

import { getFeatureFlags } from "../shared/stores/featureFlags";
import { useConnectionStore } from "../shared/stores/connectionStore";
import {
	mountAdvanceFilterPanel,
	unmountAdvanceFilterPanel,
} from "./mount/AdvanceFilterPanel";
import {
	mountStalkButtonAndPanel,
	unmountStalkButtonAndPanel,
} from "./mount/StalkPanel.tsx";
import { mountDataTable, unmountDataTable } from "./mount/DataTable";
import {
	mountProblemAssistant,
	unmountProblemAssistant,
} from "./mount/ProblemAssistant";
import {
	mountNewMaxRatedHeatmap,
	unmountNewMaxRatedHeatmap,
} from "./mount/NewMaxRatedHeatmap";

let lastFlags: Awaited<ReturnType<typeof getFeatureFlags>> | null = null;

// --- Health Check for Extension Reloads ---
// This establishes a long-lived port to monitor the connection to the service worker.
// If the port disconnects with a "context invalidated" error, it means the extension
// has been updated or reloaded. We then update a global store to notify UI
// components that they are now "zombies" and should disable themselves.
function initializeHealthCheck() {
	const healthCheckPort = chrome.runtime.connect({ name: "health-check" });
	healthCheckPort.onDisconnect.addListener(() => {
		if (chrome.runtime.lastError) {
			console.warn(
				"CF Mentor: Health check port disconnected. Extension has been updated.",
				chrome.runtime.lastError.message,
			);
			// Update the global state to indicate the connection is lost.
			useConnectionStore.getState().setConnected(false);
		}
	});
}

// Wrap in async function to handle await
async function initializeComponents() {
	const flags = await getFeatureFlags();
	const { isLoggedIn } = getLoginState();

	console.log("CF Mentor: Initializing components. Logged in:", isLoggedIn);

	// Problem Assistant panel (bookmarks+notes+stopwatch)
	// Requires login for bookmarks/notes? Usually yes for personalization.
	// Assuming ProblemAssistant benefits from login but might work partially without.
	// For now, let's say it requires login or we just explicitly check inside strict components.
	// But the user asked: "all the features where logged in is required first use this middleware"
	// Stalk button definitely requires login to be useful (or at least contextually).
	// Let's assume most personal features require login.

	if (flags.problemAssistant) {
		// If only the stopwatch flag changed while assistant remains enabled, remount to reflect UI changes
		const stopwatchChanged =
			lastFlags && lastFlags.stopwatch !== flags.stopwatch;
		if (stopwatchChanged) {
			unmountProblemAssistant();
		}
		mountProblemAssistant();
	} else {
		unmountProblemAssistant();
	}

	// Stopwatch is inside ProblemAssistantPanel, but allow hiding Stopwatch row independently
	// We'll communicate through a DOM attribute for now; the component can read it.
	if (flags.stopwatch) {
		document.documentElement.removeAttribute("data-cf-mentor-hide-stopwatch");
	} else {
		document.documentElement.setAttribute(
			"data-cf-mentor-hide-stopwatch",
			"true",
		);
	}

	// Advanced filter panel on problemset page - Does not necessarily require login, but settings might.
	if (flags.advancedFiltering) {
		mountAdvanceFilterPanel();
	} else {
		unmountAdvanceFilterPanel();
	}

	// Data table replacement on problemset page
	if (flags.advancedFiltering) {
		mountDataTable();
	} else {
		unmountDataTable();
	}

	// Contest History Summary via "Stalk" button on profile page
	// REQUIREMENT CORRECTED: Works based on profile URL, does not require login.
	if (flags.contestHistorySummary) {
		mountStalkButtonAndPanel();
	} else {
		unmountStalkButtonAndPanel();
	}

	// Max Rated Heatmap on profile page
	// Can theoretically work for other profiles even if not logged in, but if it relies on current user settings...
	// Often extensions enhance *my* experience.
	// However, usually these inject into ANY profile page.
	// The "Stalk" button is for stalking OTHERS, so I need to be logged in? Not necessarily, but maybe to fetch data effectively?
	// The prompt said "if the div contains href and some username the user is logged in... fix this issue... all the features where logged in is required".
	// I will conservatively guard likely-personal features.
	if (flags.maxRatedHeatmap) {
		mountNewMaxRatedHeatmap();
	} else {
		unmountNewMaxRatedHeatmap();
	}

	// Remember for next pass
	lastFlags = flags;
}

// React to feature flag updates from popup or other contexts
chrome.runtime.onMessage.addListener((message) => {
	if (message?.type === "cf-mentor:feature-flags-updated") {
		// Re-initialize mounts according to the latest flags
		initializeComponents().catch(console.error);
	}
});

// Also listen to storage changes as a fallback
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === "local" && changes["featureFlags"]) {
		initializeComponents().catch(console.error);
	}
});

// --- Login State Handling ---
import { getLoginState, onLoginStateChange } from "../shared/utils/auth";

// Initial user handle sync
const { isLoggedIn, handle } = getLoginState();
if (isLoggedIn && handle) {
	chrome.storage.local.set({ userHandle: handle });
	console.log("User handle set:", handle);
} else {
	// If not logged in, ensure no stale handle exists in storage
	chrome.storage.local.get("userHandle", (result) => {
		if (result.userHandle) {
			console.log("Found stale userHandle in storage while logged out. Clearing...");
			chrome.storage.local.remove("userHandle");
			// Trigger fetch to ensure clean state
			chrome.runtime.sendMessage({ action: "fetchData" });
		}
	});
}

// Call the async functions (start health check and initial mount)
initializeHealthCheck();
initializeComponents().catch(console.error);

// Watch for login/logout changes
onLoginStateChange((newState) => {
	console.log("CF Mentor: Login state changed", newState);
	if (newState.isLoggedIn && newState.handle) {
		chrome.storage.local.set({ userHandle: newState.handle });
		// Trigger a background fetch to ensure we have the new user's specific data (e.g. verdicts)
		chrome.runtime.sendMessage({ action: "fetchData" });
	} else {
		// Logged out
		chrome.storage.local.remove("userHandle");
		console.log("User logged out, cleared handle.");
		// Trigger fetch to clear user-specific data (verdicts)
		chrome.runtime.sendMessage({ action: "fetchData" });
	}
	// Re-run initialization to mount/unmount components based on new login state
	initializeComponents().catch(console.error);
});

