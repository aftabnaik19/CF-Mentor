import { getData, MENTOR_STORE } from "../shared/utils/indexedDb";
import { fetchAndStoreData } from "./dataFetcher";

type DataState = "INITIAL" | "FETCHING" | "READY" | "ERROR";

let dataState: DataState = "INITIAL";
const connectedPorts: Set<chrome.runtime.Port> = new Set();

function broadcastState() {
  console.log(`Broadcasting state: ${dataState}`);
  connectedPorts.forEach((port) => {
    port.postMessage({ state: dataState });
  });
}

async function fetchData() {
  if (dataState === "FETCHING") {
    console.log("Fetch already in progress.");
    return;
  }
  dataState = "FETCHING";
  broadcastState();

  try {
    const success = await fetchAndStoreData();
    if (success) {
      dataState = "READY";
      console.log("Data fetch successful. State is now READY.");
    } else {
      throw new Error("fetchAndStoreData returned false");
    }
  } catch (error) {
    console.error("Failed to fetch and store data:", error);
    dataState = "ERROR";
  }
  broadcastState();
}

// --- Port Connection Management ---
chrome.runtime.onConnect.addListener((port) => {
  console.log(`New connection from: ${port.name}`);
  connectedPorts.add(port);

  // If the service worker was dormant and is waking up, the state will be
  // INITIAL. We need to kick off a fetch.
  if (dataState === "INITIAL") {
    console.log("State is INITIAL, triggering data fetch.");
    fetchData();
  }

  // Immediately send the current state to the new connection
  port.postMessage({ state: dataState });

  port.onMessage.addListener(async (message) => {
    if (message.type === "get-data") {
      console.log("Received data request from content script.");
      const problems = await getData(MENTOR_STORE.PROBLEMS);
      const contests = await getData(MENTOR_STORE.CONTESTS);
      const sheets = await getData(MENTOR_STORE.SHEETS);
      const sheetsProblems = await getData(MENTOR_STORE.SHEETS_PROBLEMS);
      port.postMessage({
        type: "data-response",
        payload: { problems, contests, sheets, sheetsProblems },
      });
    }
  });

  port.onDisconnect.addListener(() => {
    console.log(`Port disconnected: ${port.name}`);
    connectedPorts.delete(port);
  });
});

// --- Alarm and Lifecycle Listeners ---
const DAILY_FETCH_ALARM = "dailyDataFetch";

function setupAlarm() {
  console.log("Setting up daily fetch alarm.");
  chrome.alarms.clear(DAILY_FETCH_ALARM, () => {
    chrome.alarms.create(DAILY_FETCH_ALARM, {
      delayInMinutes: 1,
      periodInMinutes: 24 * 60,
    });
    console.log("Daily fetch alarm created.");
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === DAILY_FETCH_ALARM) {
    console.log("Daily alarm triggered. Fetching data...");
    fetchData();
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log(`onInstalled reason: ${details.reason}`);
  setupAlarm();
  if (details.reason === "install" || details.reason === "update") {
    console.log("Extension installed or updated: fetching initial data.");
    fetchData();
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Browser startup: ensuring alarm is set and checking data state.");
  setupAlarm();
  // Check if data was fetched before, if not, fetch it.
  chrome.storage.local.get("dataReady", (result) => {
    if (!result.dataReady) {
      fetchData();
    } else {
      dataState = "READY";
    }
  });
});

// Manual refresh listener (optional, but good for debugging)
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "fetchData") {
    console.log("Received manual refresh request.");
    fetchData();
  }
});
