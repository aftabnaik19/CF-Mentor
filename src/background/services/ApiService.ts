import { StorageService, storageService } from "./StorageService";
import { CFRatingChange, CFSubmission } from "@/content/components/ContestHistorySummary/types";
import { MentorData } from "@/shared/types/mentor";
import { EXTENSION_CONFIG } from "@/shared/constants/config";

interface PendingRequest<T> {
    promise: Promise<T>;
    timestamp: number;
}

export class ApiService {
    private pendingRequests: Map<string, PendingRequest<any>> = new Map();
    private storage: StorageService;

    constructor(storage: StorageService = storageService) {
        this.storage = storage;
    }

    /**
     * Generic fetch with deduplication.
     * If a request for the same key is already in flight, returns the existing promise.
     */
    private async fetchDeduplicated<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
        const existing = this.pendingRequests.get(key);
        if (existing) {
            // If request is less than 10 seconds old, reuse it.
            if (Date.now() - existing.timestamp < 10000) {
                console.log(`[ApiService] Deduplicating request for ${key}`);
                return existing.promise;
            } else {
                // Stale pending request? Remove it.
                this.pendingRequests.delete(key);
            }
        }

        const promise = fetchFn().finally(() => {
            this.pendingRequests.delete(key);
        });

        this.pendingRequests.set(key, { promise, timestamp: Date.now() });
        return promise;
    }

    /**
     * Fetches user submissions from Codeforces API.
     * Uses caching strategies via StorageService.
     */
    async getUserSubmissions(handle: string): Promise<CFSubmission[]> {
        const cacheKey = `user_status_${handle}`;

        return this.fetchWithCache<CFSubmission[]>(
            cacheKey,
            async () => {
                const allSubmissions: CFSubmission[] = [];
                let from = 1;
                const count = 5000; // Fetch in chunks

                while (true) {
                    const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=${from}&count=${count}`;
                    console.log(`[ApiService] Fetching submissions ${from} to ${from + count}...`);

                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                    const data = await res.json();
                    if (data.status !== 'OK') throw new Error(data.comment || 'API error');

                    const batch = data.result as CFSubmission[];
                    if (batch.length === 0) break;

                    allSubmissions.push(...batch);

                    if (batch.length < count) break; // End of list
                    from += count;

                    // Throttle slightly to be nice to API
                    await new Promise(r => setTimeout(r, 200));
                }

                return allSubmissions;
            },
            24 * 60 * 60 * 1000 // 1 day TTL
        );
    }

    async getUserRating(handle: string): Promise<CFRatingChange[]> {
        const cacheKey = `user_rating_${handle}`;
        return this.fetchWithCache<CFRatingChange[]>(
            cacheKey,
            async () => {
                const url = `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                if (data.status !== 'OK') throw new Error(data.comment || 'API error');
                return data.result;
            },
            24 * 60 * 60 * 1000 // 1 day TTL
        );
    }

    async getMentorData(): Promise<MentorData> {
        // This is usually global data, not per user.
        // We might trigger a fetch.
        return this.fetchDeduplicated('mentor_data', async () => {
            const response = await fetch(EXTENSION_CONFIG.API.MENTOR_API_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        });
    }

    private async fetchWithCache<T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<T> {
        // 1. Try cache
        const cached = await this.storage.getCachedEntry<T>(key);
        if (cached && (Date.now() - cached.timestamp < ttl)) {
            console.log(`[ApiService] Cache hit for ${key}`);
            return cached.data;
        }

        // 2. Fetch (deduplicated)
        return this.fetchDeduplicated(key, async () => {
            console.log(`[ApiService] Fetching fresh data for ${key}`);
            const data = await fetchFn();
            // 3. Update cache
            await this.storage.setCached(key, data);
            return data;
        });
    }
}

export const apiService = new ApiService();
