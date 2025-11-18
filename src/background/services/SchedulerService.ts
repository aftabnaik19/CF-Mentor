import { fetchAndStoreData } from "../dataFetcher";
import { getData, MENTOR_STORE } from "@/shared/utils/indexedDb";

type DataState = "INITIAL" | "FETCHING" | "READY" | "ERROR";

export class SchedulerService {
  private dataState: DataState = "INITIAL";
  private connectedPorts: Set<chrome.runtime.Port> = new Set();
  private readonly DAILY_FETCH_ALARM = "dailyDataFetch";

  constructor() {
    this.setupAlarmListener();
    this.setupConnectionListener();
    this.setupLifecycleListeners();
  }

  private broadcastState() {
    console.log(`Broadcasting state: ${this.dataState}`);
    this.connectedPorts.forEach((port) => {
      try {
        port.postMessage({ state: this.dataState });
      } catch (e) {
        console.warn("Failed to post message to port", e);
        this.connectedPorts.delete(port);
      }
    });
  }

  async fetchData() {
    if (this.dataState === "FETCHING") {
      console.log("Fetch already in progress.");
      return;
    }
    this.dataState = "FETCHING";
    this.broadcastState();

    try {
      const success = await fetchAndStoreData();
      if (success) {
        this.dataState = "READY";
        console.log("Data fetch successful. State is now READY.");
      } else {
        throw new Error("fetchAndStoreData returned false");
      }
    } catch (error) {
      console.error("Failed to fetch and store data:", error);
      this.dataState = "ERROR";
    }
    this.broadcastState();
  }

  private setupAlarm() {
    console.log("Setting up daily fetch alarm.");
    chrome.alarms.clear(this.DAILY_FETCH_ALARM, () => {
      chrome.alarms.create(this.DAILY_FETCH_ALARM, {
        delayInMinutes: 1,
        periodInMinutes: 24 * 60,
      });
      console.log("Daily fetch alarm created.");
    });
  }

  private setupAlarmListener() {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === this.DAILY_FETCH_ALARM) {
        console.log("Daily alarm triggered. Fetching data...");
        this.fetchData();
      }
    });
  }

  private setupLifecycleListeners() {
    chrome.runtime.onInstalled.addListener((details) => {
      console.log(`onInstalled reason: ${details.reason}`);
      this.setupAlarm();
      if (details.reason === "install" || details.reason === "update") {
        console.log("Extension installed or updated: fetching initial data.");
        this.fetchData();
      }
    });

    chrome.runtime.onStartup.addListener(() => {
      console.log("Browser startup: ensuring alarm is set and checking data state.");
      this.setupAlarm();
      chrome.storage.local.get("dataReady", (result) => {
        if (!result.dataReady) {
          this.fetchData();
        } else {
          this.dataState = "READY";
        }
      });
    });
  }

  private setupConnectionListener() {
    chrome.runtime.onConnect.addListener((port) => {
      console.log(`New connection from: ${port.name}`);
      this.connectedPorts.add(port);

      if (this.dataState === "INITIAL") {
        console.log("State is INITIAL, triggering data fetch.");
        this.fetchData();
      }

      port.postMessage({ state: this.dataState });

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
        this.connectedPorts.delete(port);
      });
    });
  }
}

export const schedulerService = new SchedulerService();
