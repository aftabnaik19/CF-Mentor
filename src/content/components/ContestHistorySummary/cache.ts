import type { CacheEntry } from "./types";

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export async function getCachedData<T>(key: string): Promise<CacheEntry<T> | null> {
	return new Promise((resolve) => {
		chrome.storage.local.get([key], (result) => {
			resolve(result[key] || null);
		});
	});
}

export async function setCachedData<T>(key: string, data: T): Promise<void> {
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

export async function fetchWithCache<T>(
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