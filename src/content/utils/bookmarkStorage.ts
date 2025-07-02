// utils/bookmarkStorage.ts
export class BookmarkStorageManager {
	private static readonly STORAGE_KEY = "cf_mentor_bookmarks";

	// Get unique problem key
	static getProblemKey(contestId: string, problemIdx: string): string {
		return `${contestId}-${problemIdx}`;
	}

	// Get current problem info from URL and DOM
	static getCurrentProblemInfo(): {
		contestId: string;
		problemIdx: string;
	} | null {
		const url = window.location.href;
		const match =
			url.match(/\/contest\/(\d+)\/problem\/([A-Z]\d*)/i) ||
			url.match(/\/problemset\/problem\/(\d+)\/([A-Z]\d*)/i);

		if (match) {
			return {
				contestId: match[1],
				problemIdx: match[2].toUpperCase(),
			};
		}
		return null;
	}

	// Extract problem rating from tags
	static extractProblemRating(): string | null {
		const tagElements = document.querySelectorAll(".tag-box");
		for (const tag of tagElements) {
			const text = tag.textContent?.trim();
			if (text && text.match(/^\*\d+$/)) {
				return text;
			}
		}
		return null;
	}

	// Extract problem tags
	static extractProblemTags(): string[] {
		const tagElements = document.querySelectorAll(".tag-box");
		const tags: string[] = [];

		for (const tag of tagElements) {
			const text = tag.textContent?.trim();
			if (text && !text.match(/^\*\d+$/)) {
				// Exclude rating tags
				tags.push(text);
			}
		}
		return tags;
	}

	// Get all bookmarked problems
	static async getAllBookmarks(): Promise<BookmarkStorage> {
		return new Promise((resolve) => {
			// Try chrome.storage.sync first, fallback to chrome.storage.local
			const storage = chrome.storage?.sync || chrome.storage?.local;

			if (storage) {
				storage.get([this.STORAGE_KEY], (result) => {
					const data = result[this.STORAGE_KEY] || { bookmarkedProblems: {} };
					resolve(data);
				});
			} else {
				// Fallback to regular localStorage for testing
				const stored = localStorage.getItem(this.STORAGE_KEY);
				const data = stored ? JSON.parse(stored) : { bookmarkedProblems: {} };
				resolve(data);
			}
		});
	}

	// Save bookmark data
	static async saveBookmarks(data: BookmarkStorage): Promise<void> {
		return new Promise((resolve, reject) => {
			const storage = chrome.storage?.sync || chrome.storage?.local;

			if (storage) {
				storage.set({ [this.STORAGE_KEY]: data }, () => {
					if (chrome.runtime.lastError) {
						reject(chrome.runtime.lastError);
					} else {
						resolve();
					}
				});
			} else {
				// Fallback to localStorage
				localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
				resolve();
			}
		});
	}

	// Check if current problem is bookmarked
	static async isCurrentProblemBookmarked(): Promise<boolean> {
		const problemInfo = this.getCurrentProblemInfo();
		if (!problemInfo) return false;

		const data = await this.getAllBookmarks();
		const key = this.getProblemKey(
			problemInfo.contestId,
			problemInfo.problemIdx,
		);
		return key in data.bookmarkedProblems;
	}

	// Get current problem bookmark data
	static async getCurrentProblemBookmark(): Promise<BookmarkedProblem | null> {
		const problemInfo = this.getCurrentProblemInfo();
		if (!problemInfo) return null;

		const data = await this.getAllBookmarks();
		const key = this.getProblemKey(
			problemInfo.contestId,
			problemInfo.problemIdx,
		);
		return data.bookmarkedProblems[key] || null;
	}

	// Add/Update bookmark for current problem
	static async bookmarkCurrentProblem(
		difficultyRating: number | null = null,
		notes: string | null = null,
		timeRequiredSeconds: number | null = null,
	): Promise<void> {
		const problemInfo = this.getCurrentProblemInfo();
		if (!problemInfo)
			throw new Error("Could not extract problem info from current page");

		const data = await this.getAllBookmarks();
		const key = this.getProblemKey(
			problemInfo.contestId,
			problemInfo.problemIdx,
		);
		const now = Date.now();

		const existingBookmark = data.bookmarkedProblems[key];

		const bookmark: BookmarkedProblem = {
			contestId: problemInfo.contestId,
			problemIdx: problemInfo.problemIdx,
			difficultyRating,
			notes,
			timeRequiredSeconds,
			problemRating: this.extractProblemRating(),
			problemTags: this.extractProblemTags(),
			bookmarkedAt: existingBookmark?.bookmarkedAt || now,
			lastUpdated: now,
		};

		data.bookmarkedProblems[key] = bookmark;
		await this.saveBookmarks(data);
	}

	// Remove bookmark for current problem
	static async removeCurrentProblemBookmark(): Promise<void> {
		const problemInfo = this.getCurrentProblemInfo();
		if (!problemInfo) return;

		const data = await this.getAllBookmarks();
		const key = this.getProblemKey(
			problemInfo.contestId,
			problemInfo.problemIdx,
		);

		if (key in data.bookmarkedProblems) {
			delete data.bookmarkedProblems[key];
			await this.saveBookmarks(data);
		}
	}

	// Update specific fields for current problem
	static async updateCurrentProblemBookmark(
		updates: Partial<
			Pick<
				BookmarkedProblem,
				"difficultyRating" | "notes" | "timeRequiredSeconds"
			>
		>,
	): Promise<void> {
		const problemInfo = this.getCurrentProblemInfo();
		if (!problemInfo) return;

		const data = await this.getAllBookmarks();
		const key = this.getProblemKey(
			problemInfo.contestId,
			problemInfo.problemIdx,
		);

		if (key in data.bookmarkedProblems) {
			data.bookmarkedProblems[key] = {
				...data.bookmarkedProblems[key],
				...updates,
				lastUpdated: Date.now(),
			};
			await this.saveBookmarks(data);
		}
	}

	// Get all bookmarked problems as array (for display/export)
	static async getBookmarkedProblemsArray(): Promise<BookmarkedProblem[]> {
		const data = await this.getAllBookmarks();
		return Object.values(data.bookmarkedProblems).sort(
			(a, b) => b.bookmarkedAt - a.bookmarkedAt,
		); // Latest first
	}

	// Search bookmarked problems
	static async searchBookmarks(query: {
		tags?: string[];
		difficultyRating?: number;
		problemRating?: string;
		contestId?: string;
	}): Promise<BookmarkedProblem[]> {
		const problems = await this.getBookmarkedProblemsArray();

		return problems.filter((problem) => {
			if (
				query.tags &&
				!query.tags.some((tag) => problem.problemTags.includes(tag))
			) {
				return false;
			}
			if (
				query.difficultyRating &&
				problem.difficultyRating !== query.difficultyRating
			) {
				return false;
			}
			if (
				query.problemRating &&
				problem.problemRating !== query.problemRating
			) {
				return false;
			}
			if (query.contestId && problem.contestId !== query.contestId) {
				return false;
			}
			return true;
		});
	}

	// Export bookmarks as JSON
	static async exportBookmarks(): Promise<string> {
		const data = await this.getAllBookmarks();
		return JSON.stringify(data, null, 2);
	}

	// Import bookmarks from JSON
	static async importBookmarks(jsonData: string): Promise<void> {
		try {
			const importedData: BookmarkStorage = JSON.parse(jsonData);
			const currentData = await this.getAllBookmarks();

			// Merge with existing data (imported data takes precedence)
			const mergedData: BookmarkStorage = {
				bookmarkedProblems: {
					...currentData.bookmarkedProblems,
					...importedData.bookmarkedProblems,
				},
			};

			await this.saveBookmarks(mergedData);
		} catch (error) {
			throw new Error("Invalid JSON data for import");
		}
	}
}
