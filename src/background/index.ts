import { BookmarkedProblem, BookmarkStorage } from "@/shared/types/bookmark";

import { MESSAGE_TYPES } from "../shared/constants/messages";
import { getData, MENTOR_STORE } from "../shared/utils/indexedDb";
import { fetchAndStoreData } from "./dataFetcher";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

type CacheEntry<T> = { data: T; timestamp: number };

async function getCachedData<T>(key: string): Promise<CacheEntry<T> | null> {
	return new Promise((resolve) => {
		chrome.storage.local.get([key], (result) => {
			resolve(result[key] || null);
		});
	});
}

async function setCachedData<T>(key: string, data: T): Promise<void> {
	const entry: CacheEntry<T> = { data, timestamp: Date.now() };
	return new Promise((resolve, reject) => {
		chrome.storage.local.set({ [key]: entry }, () => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
			} else {
				resolve();
			}
		});
	});
}

async function fetchJson<T extends { status?: string; result?: unknown; comment?: string }>(url: string): Promise<T> {
	const res = await fetch(url, { credentials: "include" });
	if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
	const data = (await res.json()) as T;
	if (data.status && data.status !== "OK") throw new Error(data.comment || `API error for ${url}`);
	return data;
}

async function fetchWithCache<T>(
	key: string,
	fetchFn: () => Promise<{ status: string; result: T }>
): Promise<T> {
	const cached = await getCachedData<T>(key);
	const now = Date.now();
	const isExpired = !cached || (now - cached.timestamp) > CACHE_TTL_MS;

	if (!isExpired) {
		return cached.data;
	}

	try {
		const response = await fetchFn();
		if (response.status === "OK" && response.result) {
			await setCachedData(key, response.result);
			return response.result;
		} else {
			throw new Error("API status not OK");
		}
	} catch (error) {
		// If API fails and we have expired cache, use it
		if (cached) {
			console.warn(`API failed for ${key}, using expired cache`);
			return cached.data;
		}
		throw error;
	}
}

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

  if (dataState === "INITIAL") {
    console.log("State is INITIAL, triggering data fetch.");
    fetchData();
  }

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

// --- Bookmark Storage Logic ---

const BASE_STORAGE_KEY = "cf_mentor_bookmarks";

const getUserStorageKey = (handle: string): string => {
  return `${BASE_STORAGE_KEY}_${handle}`;
};

const getProblemKey = (contestId: string, problemIdx: string): string => {
  return contestId + problemIdx;
};

const performUpdate = (
  handle: string,
  mutator: (currentData: BookmarkStorage) => BookmarkStorage
): Promise<void> => {
  const userStorageKey = getUserStorageKey(handle);
  if (!userStorageKey) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const storage = chrome.storage.sync;
    storage.get([userStorageKey], (result) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }

      const currentData = result[userStorageKey] || { bookmarkedProblems: {} };
      const newData = mutator(currentData);

      storage.set({ [userStorageKey]: newData }, () => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve();
      });
    });
  });
};

const getUserData = async (handle: string): Promise<BookmarkStorage> => {
  const userStorageKey = getUserStorageKey(handle);
  if (!userStorageKey) return { bookmarkedProblems: {} };

  return new Promise((resolve) => {
    const storage = chrome.storage.sync;
    storage.get([userStorageKey], (result) => {
      resolve(result[userStorageKey] || { bookmarkedProblems: {} });
    });
  });
};


// --- Message Listener for Bookmarks and other actions ---

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "fetchData") {
    console.log("Received manual refresh request.");
    fetchData();
    return; // Not asynchronous
  }

  if (request.type === "fetch-user-data") {
    const { handle } = request;
    (async () => {
      try {
        const rating = await fetchWithCache(`${handle}.rating`, () =>
          fetchJson<{ status: string; result: any[] }>(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`)
        );
        const submissions = await fetchWithCache(`${handle}.status`, () =>
          fetchJson<{ status: string; result: any[] }>(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1`)
        );
        sendResponse({ success: true, rating, submissions });
      } catch (error) {
        sendResponse({ success: false, error: (error as Error).message });
      }
    })();
    return true; // Keep channel open for async response
  }

  const { type, payload } = request;

  if (
    !type ||
    !type.startsWith("IS_PROBLEM_BOOKMARKED") &&
    !type.startsWith("GET_BOOKMARK") &&
    !type.startsWith("GET_ALL_BOOKMARKS") &&
    !type.startsWith("ADD_OR_UPDATE_BOOKMARK") &&
    !type.startsWith("REMOVE_BOOKMARK")
  ) {
    return;
  }

  const { handle, problemInfo } = payload;
  if (!handle) {
    console.error("No user handle provided for bookmark operation.");
    sendResponse({ error: "User handle is required." });
    return true;
  }

  switch (type) {
    case MESSAGE_TYPES.IS_PROBLEM_BOOKMARKED:
      getUserData(handle).then((userData) => {
        const key = getProblemKey(problemInfo.contestId, problemInfo.problemIdx);
        sendResponse(key in userData.bookmarkedProblems);
      });
      return true;

    case MESSAGE_TYPES.GET_BOOKMARK:
      getUserData(handle).then((userData) => {
        const key = getProblemKey(problemInfo.contestId, problemInfo.problemIdx);
        sendResponse(userData.bookmarkedProblems[key] || null);
      });
      return true;

    case MESSAGE_TYPES.GET_ALL_BOOKMARKS:
      getUserData(handle).then((userData) => {
        const bookmarksArray = Object.values(userData.bookmarkedProblems).sort(
          (a, b) => b.bookmarkedAt - a.bookmarkedAt
        );
        sendResponse(bookmarksArray);
      });
      return true;

    case MESSAGE_TYPES.ADD_OR_UPDATE_BOOKMARK: {
      const { difficultyRating, notes, timeRequiredSeconds, problemRating, problemTags } = payload;
      const key = getProblemKey(problemInfo.contestId, problemInfo.problemIdx);
      const now = Date.now();

      performUpdate(handle, (currentData) => {
        const existingBookmark = currentData.bookmarkedProblems[key];
        const bookmark: BookmarkedProblem = {
          contestId: problemInfo.contestId,
          problemIdx: problemInfo.problemIdx,
          difficultyRating,
          notes,
          timeRequiredSeconds,
          problemRating,
          problemTags,
          bookmarkedAt: existingBookmark?.bookmarkedAt || now,
          lastUpdated: now,
        };
        currentData.bookmarkedProblems[key] = bookmark;
        return currentData;
      })
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ error: error.message }));
      return true;
    }
    case MESSAGE_TYPES.REMOVE_BOOKMARK: {
      const problemKey = getProblemKey(
        problemInfo.contestId,
        problemInfo.problemIdx,
      );
      performUpdate(handle, (currentData) => {
        delete currentData.bookmarkedProblems[problemKey];
        return currentData;
      })
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ error: error.message }));
      return true;
    }
  }

  return true; // Keep the message channel open for async response
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
  chrome.storage.local.get("dataReady", (result) => {
    if (!result.dataReady) {
      fetchData();
    } else {
      dataState = "READY";
    }
  });
});