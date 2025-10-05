import { fetchAndStoreData } from "./data-fetcher";
const DAILY_FETCH_ALARM = "dailyDataFetch";

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

// This runs only when the extension is first installed
chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === "install") {
		console.log("First install: fetching initial data.");
		fetchAndStoreData();
	}
});

// This runs every time the service worker starts.
// It ensures the alarm is always set, even after a reload during development.
chrome.alarms.get(DAILY_FETCH_ALARM, (alarm) => {
	if (!alarm) {
		console.log("Daily fetch alarm not found, creating it now.");
		chrome.alarms.create(DAILY_FETCH_ALARM, {
			delayInMinutes: 1, // Wait 1 minute before the first run
			periodInMinutes: 24 * 60, // Use this for production (24 hours)
		});
	} else {
		console.log("Daily fetch alarm already exists.");
	}
});

