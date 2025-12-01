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

	// Problem Assistant panel (bookmarks+notes+stopwatch)
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

	// Advanced filter panel on problemset page
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
	if (flags.contestHistorySummary) {
		mountStalkButtonAndPanel();
	} else {
		unmountStalkButtonAndPanel();
	}

	// Max Rated Heatmap on profile page
	if (flags.maxRatedHeatmap) {
		mountNewMaxRatedHeatmap();
	} else {
		unmountNewMaxRatedHeatmap();
	}



	// Remember for next pass
	lastFlags = flags;
}

// Get user handle from page
const handleElement = document.querySelector('a[href^="/profile/"]');
if (handleElement) {
	const handle = handleElement.textContent?.trim();
	if (handle) {
		chrome.storage.local.set({ userHandle: handle });
		console.log("User handle set:", handle);
	}
}

// Call the async functions
initializeHealthCheck();
initializeComponents().catch(console.error);

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
