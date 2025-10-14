import "primereact/resources/primereact.min.css"; // core styles
import "primeicons/primeicons.css";

import { useConnectionStore } from "../shared/stores/connectionStore";
import { mountAdvanceFilterPanel } from "./mount/AdvanceFilterPanel";
import { mountDataTable } from "./mount/DataTable";
import { mountProblemAssistant } from "./mount/ProblemAssistant";

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
	mountProblemAssistant();
	mountAdvanceFilterPanel();
	mountDataTable();
	// await mountChatPanel();
}

// Call the async functions
initializeHealthCheck();
initializeComponents().catch(console.error);
