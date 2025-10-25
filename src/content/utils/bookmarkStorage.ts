import { MESSAGE_TYPES } from "@/shared/constants/messages";
import { BookmarkedProblem } from "@/shared/types/bookmark";

import {
  extractProblemRating,
  extractProblemTags,
  getCurrentProblemInfo,
  getCurrentUserHandle,
} from "./domUtils";

// Helper to send messages to the background script
const sendMessage = <T>(type: string, payload?: unknown): Promise<T> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (response?.error) {
        return reject(new Error(response.error));
      }
      resolve(response as T);
    });
  });
};

// Get unique problem key (can still be useful on the client)
export const getProblemKey = (contestId: string, problemIdx: string): string => {
  return contestId + problemIdx;
};

// --- Public API ---

export const isCurrentProblemBookmarked = async (): Promise<boolean> => {
  const problemInfo = getCurrentProblemInfo();
  const handle = getCurrentUserHandle();
  if (!problemInfo || !handle) return false;

  return sendMessage<boolean>(MESSAGE_TYPES.IS_PROBLEM_BOOKMARKED, { problemInfo, handle });
};

export const getCurrentProblemBookmark = async (): Promise<BookmarkedProblem | null> => {
  const problemInfo = getCurrentProblemInfo();
  const handle = getCurrentUserHandle();
  if (!problemInfo || !handle) return null;

  return sendMessage<BookmarkedProblem | null>(MESSAGE_TYPES.GET_BOOKMARK, { problemInfo, handle });
};

export const bookmarkCurrentProblem = async (
  difficultyRating: number | null = null,
  notes: string | null = null,
  timeRequiredSeconds: number | null = null
): Promise<void> => {
  const problemInfo = getCurrentProblemInfo();
  const handle = getCurrentUserHandle();
  if (!problemInfo || !handle) {
    throw new Error("Could not get problem info or user handle from page.");
  }

  const payload = {
    handle,
    problemInfo,
    difficultyRating,
    notes,
    timeRequiredSeconds,
    problemRating: extractProblemRating(),
    problemTags: extractProblemTags(),
  };

  await sendMessage(MESSAGE_TYPES.ADD_OR_UPDATE_BOOKMARK, payload);
};

export const removeCurrentProblemBookmark = async (): Promise<void> => {
  const problemInfo = getCurrentProblemInfo();
  const handle = getCurrentUserHandle();
  if (!problemInfo || !handle) return;

  await sendMessage(MESSAGE_TYPES.REMOVE_BOOKMARK, { problemInfo, handle });
};

export const updateCurrentProblemBookmark = async (
  updates: Partial<Pick<BookmarkedProblem, "difficultyRating" | "notes" | "timeRequiredSeconds">>
): Promise<void> => {
    const problemInfo = getCurrentProblemInfo();
    const handle = getCurrentUserHandle();
    if (!problemInfo || !handle) return;

    // This is a bit tricky since the background script handles the full update.
    // We can send the updates and let the background script merge them.
    // For now, we will re-implement this using the more granular ADD_OR_UPDATE_BOOKMARK
    const currentBookmark = await getCurrentProblemBookmark();
    if (!currentBookmark) return;

    const payload = {
        handle,
        problemInfo,
        difficultyRating: updates.difficultyRating ?? currentBookmark.difficultyRating,
        notes: updates.notes ?? currentBookmark.notes,
        timeRequiredSeconds: updates.timeRequiredSeconds ?? currentBookmark.timeRequiredSeconds,
        problemRating: currentBookmark.problemRating,
        problemTags: currentBookmark.problemTags,
    };

    await sendMessage(MESSAGE_TYPES.ADD_OR_UPDATE_BOOKMARK, payload);
};

export const getBookmarkedProblemsArray = async (): Promise<BookmarkedProblem[]> => {
  const handle = getCurrentUserHandle();
  if (!handle) return [];

  return sendMessage<BookmarkedProblem[]>(MESSAGE_TYPES.GET_ALL_BOOKMARKS, { handle });
};

// The search, export, and import functions would also need to be refactored
// to use the message passing system. For now, we will leave them as is,
// but they will not work correctly without being moved to the background script.

export const searchBookmarks = async (_query: any): Promise<BookmarkedProblem[]> => {
    console.warn("searchBookmarks is not implemented with the service worker yet.");
    return [];
}

export const exportBookmarks = async (): Promise<string> => {
    console.warn("exportBookmarks is not implemented with the service worker yet.");
    return "";
}

export const importBookmarks = async (_jsonData: string): Promise<void> => {
    console.warn("importBookmarks is not implemented with the service worker yet.");
}