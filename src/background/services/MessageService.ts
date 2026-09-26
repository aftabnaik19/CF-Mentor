import { MESSAGE_TYPES } from "@/shared/constants/messages";
import { bookmarkService } from "./BookmarkService";
import { schedulerService } from "./SchedulerService";
import { storageService } from "./StorageService";
import { apiService } from "./ApiService";
import { getData, MENTOR_STORE } from "../../shared/utils/indexedDb";
import { Problem } from "../../shared/types/mentor";

export class MessageService {
  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      this.handleMessage(request, sendResponse);
      return true; // Keep channel open for async response
    });
  }

  private async handleMessage(request: any, sendResponse: (response: any) => void) {
    console.log("MessageService received request:", request);
    if (!request) {
      sendResponse({ error: "Empty request" });
      return;
    }
    try {
      if (request.action === "fetchData") {
        console.log("Received manual refresh request.");
        await schedulerService.fetchData();
        sendResponse({ status: "ok" });
        return;
      }

      // Use ApiService for data fetching
      if (request.type === "fetch-user-data") {
        await this.handleFetchUserData(request, sendResponse);
        return;
      }

      const { type, payload } = request;

      // Handle IndexedDB problem lookup (not a bookmark message)
      if (type === MESSAGE_TYPES.GET_PROBLEM_FROM_DB) {
        const { contestId, index } = payload;
        console.log(`[GET_PROBLEM_FROM_DB] Looking up contestId=${contestId} (type: ${typeof contestId}), index=${index}`);
        const problems = await getData<Problem>(MENTOR_STORE.PROBLEMS);
        console.log(`[GET_PROBLEM_FROM_DB] Total problems in DB: ${problems.length}`);
        // Sample first few to see the data format
        if (problems.length > 0) {
          const sample = problems[0];
          console.log(`[GET_PROBLEM_FROM_DB] Sample problem: contestId=${sample.contestId} (type: ${typeof sample.contestId}), index=${sample.index}`);
        }
        const match = problems.find(
          p => p.contestId === Number(contestId) && p.index.toUpperCase() === String(index).toUpperCase()
        );
        console.log(`[GET_PROBLEM_FROM_DB] Match found:`, match ? `${match.contestId}${match.index} (cfRating=${match.cfRating}, tags=${match.tags})` : 'null');
        sendResponse(match || null);
        return;
      }

      if (this.isBookmarkMessage(type)) {
        await this.handleBookmarkMessage(type, payload, sendResponse);
        return;
      }

      // Default response for unknown messages to close the channel
      console.warn("Unknown message type:", type);
      sendResponse({ error: "Unknown message type" });

    } catch (error) {
      console.error("Error handling message:", error);
      sendResponse({
        error: (error as Error).message,
        stack: (error as Error).stack
      });
    }
  }

  private isBookmarkMessage(type: string): boolean {
    return (
      type === MESSAGE_TYPES.IS_PROBLEM_BOOKMARKED ||
      type === MESSAGE_TYPES.GET_BOOKMARK ||
      type === MESSAGE_TYPES.GET_ALL_BOOKMARKS ||
      type === MESSAGE_TYPES.ADD_OR_UPDATE_BOOKMARK ||
      type === MESSAGE_TYPES.REMOVE_BOOKMARK
    );
  }

  private async handleFetchUserData(request: any, sendResponse: (response: any) => void) {
    const { handle } = request;
    if (!handle) {
      sendResponse({ success: false, error: "User handle is required." });
      return;
    }
    try {
      const rating = await apiService.getUserRating(handle);
      const submissions = await apiService.getUserSubmissions(handle);

      sendResponse({ success: true, rating, submissions });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private async handleBookmarkMessage(type: string, payload: any, sendResponse: (response: any) => void) {
    const { handle, problemInfo } = payload;
    if (!handle) {
      sendResponse({ error: "User handle is required." });
      return;
    }

    // Session Verification: Ensure request handle matches the globally tracked user handle.
    // This prevents stale tabs (showing User A) from writing data if the session changed to User B in another tab.
    const stored = await storageService.getLocal<{ userHandle: string }>("userHandle");
    if (stored && stored.userHandle && stored.userHandle !== handle) {
      console.warn(`Session mismatch: Request(${handle}) vs Storage(${stored.userHandle}). Rejecting.`);
      sendResponse({ error: "Session mismatch. Please refresh the page." });
      return;
    }

    switch (type) {
      case MESSAGE_TYPES.IS_PROBLEM_BOOKMARKED:
        const isBookmarked = await bookmarkService.isBookmarked(
          handle,
          problemInfo.contestId,
          problemInfo.problemIdx
        );
        sendResponse(isBookmarked);
        break;

      case MESSAGE_TYPES.GET_BOOKMARK:
        const bookmark = await bookmarkService.getBookmark(
          handle,
          problemInfo.contestId,
          problemInfo.problemIdx
        );
        sendResponse(bookmark);
        break;

      case MESSAGE_TYPES.GET_ALL_BOOKMARKS:
        const bookmarks = await bookmarkService.getAllBookmarks(handle);
        sendResponse(bookmarks);
        break;

      case MESSAGE_TYPES.ADD_OR_UPDATE_BOOKMARK:
        await bookmarkService.addOrUpdateBookmark(handle, {
          contestId: problemInfo.contestId,
          problemIdx: problemInfo.problemIdx,
          ...payload, // difficultyRating, notes, etc.
        });
        sendResponse({ success: true });
        break;

      case MESSAGE_TYPES.REMOVE_BOOKMARK:
        await bookmarkService.removeBookmark(
          handle,
          problemInfo.contestId,
          problemInfo.problemIdx
        );
        sendResponse({ success: true });
        break;
    }
  }
}

export const messageService = new MessageService();
