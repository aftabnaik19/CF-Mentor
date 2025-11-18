import { MESSAGE_TYPES } from "@/shared/constants/messages";
import { bookmarkService } from "./BookmarkService";
import { schedulerService } from "./SchedulerService";
import { storageService } from "./StorageService";
import { CFRatingChange, CFSubmission } from "@/content/components/ContestHistorySummary/types";

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

      if (request.type === "fetch-user-data") {
        await this.handleFetchUserData(request, sendResponse);
        return;
      }

      const { type, payload } = request;

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
        // We need to expose fetchWithCache or similar from SchedulerService or a new ApiService
        // For now, I'll assume we can move the fetch logic here or to a helper
        // But wait, the original code had fetchWithCache in background/index.ts
        // I should probably move that to a utility or ApiService.
        // For this refactor step, I will use the schedulerService if I put the fetch logic there,
        // or I'll create a private helper here if it's simple.
        
        // Let's use the existing pattern but cleaner.
        // Actually, I should probably create an ApiService for this.
        // But to stick to the plan, I'll implement the logic here using a helper.
        
        const rating = await this.fetchJsonWithCache<CFRatingChange[]>(`user_rating_${handle}`, 
            `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`);
            
        const submissions = await this.fetchJsonWithCache<CFSubmission[]>(`user_status_${handle}`,
            `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1`);

        sendResponse({ success: true, rating, submissions });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private async fetchJsonWithCache<T>(key: string, url: string): Promise<T> {
      const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
      const cached = await storageService.getCachedEntry<T>(key);
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
          return cached.data;
      }

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const data = await res.json();
      if (data.status && data.status !== "OK") throw new Error(data.comment || `API error for ${url}`);
      
      await storageService.setCached(key, data.result);
      return data.result as T;
  }

  private async handleBookmarkMessage(type: string, payload: any, sendResponse: (response: any) => void) {
    const { handle, problemInfo } = payload;
    if (!handle) {
      sendResponse({ error: "User handle is required." });
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
