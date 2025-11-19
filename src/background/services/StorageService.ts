import { BookmarkStorage } from "@/shared/types/bookmark";
import { deleteData, getData, MENTOR_STORE, saveData, saveItems } from "@/shared/utils/indexedDb";

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

  // --- Caching Logic (IndexedDB) ---

  async getCached<T>(key: string): Promise<T | null> {
    const results = await getData<{ key: string; data: T; timestamp: number }>(
      MENTOR_STORE.USER_CACHE,
      [key]
    );
    return results.length > 0 ? results[0].data : null;
  }

  async getCachedEntry<T>(key: string): Promise<{ data: T; timestamp: number } | null> {
    const results = await getData<{ key: string; data: T; timestamp: number }>(
      MENTOR_STORE.USER_CACHE,
      [key]
    );
    return results.length > 0 ? results[0] : null;
  }

  async setCached<T>(key: string, data: T): Promise<void> {
    const entry = { key, data, timestamp: Date.now() };
    await saveItems(MENTOR_STORE.USER_CACHE, [entry]);
  }

  async clearExpiredCache(ttlMs: number): Promise<void> {
    console.log("Checking for expired cache entries...");
    const allCache = await getData<{ key: string; timestamp: number }>(
      MENTOR_STORE.USER_CACHE
    );
    const now = Date.now();
    const expiredKeys = allCache
      .filter((entry) => now - entry.timestamp > ttlMs)
      .map((entry) => entry.key);

    if (expiredKeys.length > 0) {
      console.log(`Deleting ${expiredKeys.length} expired cache entries.`);
      await deleteData(MENTOR_STORE.USER_CACHE, expiredKeys);
    } else {
      console.log("No expired cache entries found.");
    }
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
