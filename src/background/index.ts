import { fetchAndStoreData } from "./data-fetcher";

const DAILY_FETCH_ALARM = "dailyDataFetch";

/**
 * Clears any existing alarm and creates a new one with the correct period.
 * This ensures that the alarm is always correctly configured.
 */
function setupAlarm() {
	console.log("Setting up daily fetch alarm.");
	chrome.alarms.clear(DAILY_FETCH_ALARM, () => {
		chrome.alarms.create(DAILY_FETCH_ALARM, {
			delayInMinutes: 1, // Wait 1 minute before the first run
			periodInMinutes: 24 * 60, // 24 hours
		});
		console.log("Daily fetch alarm created with a 24-hour period.");
	});
}

// --- Listeners (These should always be at the top level) ---

// Listener for the alarm firing
chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === DAILY_FETCH_ALARM) {
		console.log("Periodic alarm triggered. Fetching data...");
		fetchAndStoreData();
	}
});

// Listener for manual refresh requests from the popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
	if (request.action === "fetchData") {
		console.log("Received manual refresh request from popup.");
		fetchAndStoreData()
			.then(() => {
				sendResponse({ status: "Data fetch initiated successfully." });
			})
			.catch((error) => {
				console.error("Data fetch failed:", error);
				sendResponse({
					status: "Data fetch failed. See background console for errors.",
				});
			});
		return true; // Indicates asynchronous response
	}
});

// --- Initial Setup ---

// Set up the alarm when the extension is first installed or updated.
chrome.runtime.onInstalled.addListener((details) => {
	console.log(`onInstalled reason: ${details.reason}`);
	setupAlarm();
	// Also fetch data immediately on first install.
	if (details.reason === "install") {
		console.log("First install: fetching initial data.");
		fetchAndStoreData();
	}
});

// Also set up the alarm when the browser starts up.
chrome.runtime.onStartup.addListener(() => {
	console.log("Browser startup: ensuring alarm is set.");
	setupAlarm();
});
