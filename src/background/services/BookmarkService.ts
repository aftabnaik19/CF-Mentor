import { BookmarkedProblem } from "@/shared/types/bookmark";
import { storageService } from "./StorageService";

export class BookmarkService {
  private getProblemKey(contestId: string, problemIdx: string): string {
    return contestId + problemIdx;
  }

  async isBookmarked(handle: string, contestId: string, problemIdx: string): Promise<boolean> {
    const data = await storageService.getUserBookmarks(handle);
    const key = this.getProblemKey(contestId, problemIdx);
    return key in data.bookmarkedProblems;
  }

  async getBookmark(handle: string, contestId: string, problemIdx: string): Promise<BookmarkedProblem | null> {
    const data = await storageService.getUserBookmarks(handle);
    const key = this.getProblemKey(contestId, problemIdx);
    return data.bookmarkedProblems[key] || null;
  }

  async getAllBookmarks(handle: string): Promise<BookmarkedProblem[]> {
    const data = await storageService.getUserBookmarks(handle);
    return Object.values(data.bookmarkedProblems).sort(
      (a, b) => b.bookmarkedAt - a.bookmarkedAt
    );
  }

  async addOrUpdateBookmark(
    handle: string,
    bookmark: BookmarkedProblem
  ): Promise<void> {
    const data = await storageService.getUserBookmarks(handle);
    const key = this.getProblemKey(bookmark.contestId, bookmark.problemIdx);
    
    // Preserve original bookmarkedAt if updating
    const existing = data.bookmarkedProblems[key];
    const now = Date.now();
    
    data.bookmarkedProblems[key] = {
      ...bookmark,
      bookmarkedAt: existing?.bookmarkedAt || now,
      lastUpdated: now,
    };

    await storageService.saveUserBookmarks(handle, data);
  }

  async removeBookmark(handle: string, contestId: string, problemIdx: string): Promise<void> {
    const data = await storageService.getUserBookmarks(handle);
    const key = this.getProblemKey(contestId, problemIdx);
    
    if (key in data.bookmarkedProblems) {
      delete data.bookmarkedProblems[key];
      await storageService.saveUserBookmarks(handle, data);
    }
  }
}

export const bookmarkService = new BookmarkService();
