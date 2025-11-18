import { BookmarkStorage } from "@/shared/types/bookmark";
import { getData, saveData } from "@/shared/utils/indexedDb";

export class StorageService {
  // --- Chrome Storage Wrappers ---

  async getLocal<T>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  }

  async setLocal<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  async getSync<T>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      chrome.storage.sync.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  }

  async setSync<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  // --- IndexedDB Wrappers ---
  // Re-using the existing utility functions but wrapping them for consistency and easier mocking

  async getIndexedDbData<T>(storeName: string): Promise<T[]> {
    return getData<T>(storeName);
  }

  async setIndexedDbData(storeName: string, data: any[]): Promise<void> {
    return saveData(storeName, data);
  }

  // --- Specific Helpers ---

  async getUserBookmarks(handle: string): Promise<BookmarkStorage> {
    const key = `cf_mentor_bookmarks_${handle}`;
    const data = await this.getSync<BookmarkStorage>(key);
    return data || { bookmarkedProblems: {} };
  }

  async saveUserBookmarks(handle: string, data: BookmarkStorage): Promise<void> {
    const key = `cf_mentor_bookmarks_${handle}`;
    await this.setSync(key, data);
  }
}

export const storageService = new StorageService();
