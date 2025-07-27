import { BookmarkedProblem, BookmarkStorage } from "@/shared/types/bookmark";

const BASE_STORAGE_KEY = "cf_mentor_bookmarks";

// Get the current Codeforces user handle from the page header
export const getCurrentUserHandle = (): string | null => {
	const profileLink = document.querySelector(
		"#header a[href^='/profile/']",
	) as HTMLAnchorElement;
	return profileLink?.innerText ?? null;
};

// Get the user-specific storage key
const getUserStorageKey = (): string | null => {
	const handle = getCurrentUserHandle();
	if (!handle) return null;
	return `${BASE_STORAGE_KEY}_${handle}`;
};

// Get unique problem key
export const getProblemKey = (
	contestId: string,
	problemIdx: string,
): string => {
	return contestId + problemIdx;
};

// Get current problem info from URL and DOM
export const getCurrentProblemInfo = (): {
	contestId: string;
	problemIdx: string;
} | null => {
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
};

// Extract problem rating from tags
export const extractProblemRating = (): string | null => {
	const tagElements = document.querySelectorAll(".tag-box");
	for (const tag of Array.from(tagElements)) {
		const text = tag.textContent?.trim();
		if (text && text.match(/^\*\d+$/)) {
			return text;
		}
	}
	return null;
};

// Extract problem tags
export const extractProblemTags = (): string[] => {
	const tagElements = document.querySelectorAll(".tag-box");
	const tags: string[] = [];

	for (const tag of Array.from(tagElements)) {
		const text = tag.textContent?.trim();
		if (text && !text.match(/^\*\d+$/)) {
			// Exclude rating tags
			tags.push(text);
		}
	}
	return tags;
};

// --- User-Scoped Storage Functions ---

// Get bookmark data for the current user
const getUserData = async (): Promise<BookmarkStorage> => {
	const userStorageKey = getUserStorageKey();
	if (!userStorageKey) return { bookmarkedProblems: {} }; // Return empty if not logged in

	return new Promise((resolve) => {
		const storage = chrome.storage?.sync || chrome.storage?.local;
		if (storage) {
			storage.get([userStorageKey], (result) => {
				resolve(result[userStorageKey] || { bookmarkedProblems: {} });
			});
		} else {
			const stored = localStorage.getItem(userStorageKey);
			resolve(stored ? JSON.parse(stored) : { bookmarkedProblems: {} });
		}
	});
};

// Save bookmark data for the current user
const saveUserData = async (userData: BookmarkStorage): Promise<void> => {
	const userStorageKey = getUserStorageKey();
	if (!userStorageKey) return; // Do nothing if not logged in

	return new Promise((resolve, reject) => {
		const storage = chrome.storage?.sync || chrome.storage?.local;
		if (storage) {
			storage.set({ [userStorageKey]: userData }, () => {
				if (chrome.runtime.lastError) {
					reject(chrome.runtime.lastError);
				} else {
					resolve();
				}
			});
		} else {
			localStorage.setItem(userStorageKey, JSON.stringify(userData));
			resolve();
		}
	});
};

// --- Public API ---

// Check if current problem is bookmarked
export const isCurrentProblemBookmarked = async (): Promise<boolean> => {
	const problemInfo = getCurrentProblemInfo();
	if (!problemInfo) return false;

	const userData = await getUserData();
	const key = getProblemKey(problemInfo.contestId, problemInfo.problemIdx);
	return key in userData.bookmarkedProblems;
};

// Get current problem bookmark data
export const getCurrentProblemBookmark =
	async (): Promise<BookmarkedProblem | null> => {
		const problemInfo = getCurrentProblemInfo();
		if (!problemInfo) return null;

		const userData = await getUserData();
		const key = getProblemKey(problemInfo.contestId, problemInfo.problemIdx);
		return userData.bookmarkedProblems[key] || null;
	};

// Add/Update bookmark for current problem
export const bookmarkCurrentProblem = async (
	difficultyRating: number | null = null,
	notes: string | null = null,
	timeRequiredSeconds: number | null = null,
): Promise<void> => {
	const problemInfo = getCurrentProblemInfo();
	if (!problemInfo)
		throw new Error("Could not extract problem info from current page");

	const userData = await getUserData();
	const key = getProblemKey(problemInfo.contestId, problemInfo.problemIdx);
	const now = Date.now();

	const existingBookmark = userData.bookmarkedProblems[key];

	const bookmark: BookmarkedProblem = {
		contestId: problemInfo.contestId,
		problemIdx: problemInfo.problemIdx,
		difficultyRating,
		notes,
		timeRequiredSeconds,
		problemRating: extractProblemRating(),
		problemTags: extractProblemTags(),
		bookmarkedAt: existingBookmark?.bookmarkedAt || now,
		lastUpdated: now,
	};

	userData.bookmarkedProblems[key] = bookmark;
	await saveUserData(userData);
};

// Remove bookmark for current problem
export const removeCurrentProblemBookmark = async (): Promise<void> => {
	const problemInfo = getCurrentProblemInfo();
	if (!problemInfo) return;

	const userData = await getUserData();
	const key = getProblemKey(problemInfo.contestId, problemInfo.problemIdx);

	if (key in userData.bookmarkedProblems) {
		delete userData.bookmarkedProblems[key];
		await saveUserData(userData);
	}
};

// Update specific fields for current problem
export const updateCurrentProblemBookmark = async (
	updates: Partial<
		Pick<
			BookmarkedProblem,
			"difficultyRating" | "notes" | "timeRequiredSeconds"
		>
	>,
): Promise<void> => {
	const problemInfo = getCurrentProblemInfo();
	if (!problemInfo) return;

	const userData = await getUserData();
	const key = getProblemKey(problemInfo.contestId, problemInfo.problemIdx);

	if (key in userData.bookmarkedProblems) {
		userData.bookmarkedProblems[key] = {
			...userData.bookmarkedProblems[key],
			...updates,
			lastUpdated: Date.now(),
		};
		await saveUserData(userData);
	}
};

// Get all bookmarked problems as array for the current user
export const getBookmarkedProblemsArray = async (): Promise<
	BookmarkedProblem[]
> => {
	const userData = await getUserData();
	return Object.values(userData.bookmarkedProblems).sort(
		(a, b) => b.bookmarkedAt - a.bookmarkedAt,
	); // Latest first
};

// Search bookmarked problems for the current user
export const searchBookmarks = async (query: {
	tags?: string[];
	difficultyRating?: number;
	problemRating?: string;
	contestId?: string;
}): Promise<BookmarkedProblem[]> => {
	const problems = await getBookmarkedProblemsArray();

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
		if (query.problemRating && problem.problemRating !== query.problemRating) {
			return false;
		}
		if (query.contestId && problem.contestId !== query.contestId) {
			return false;
		}
		return true;
	});
};

// Export bookmarks as JSON for the current user
export const exportBookmarks = async (): Promise<string> => {
	const userData = await getUserData();
	return JSON.stringify(userData, null, 2);
};

// Import bookmarks from JSON for the current user
export const importBookmarks = async (jsonData: string): Promise<void> => {
	const userStorageKey = getUserStorageKey();
	if (!userStorageKey) throw new Error("User not logged in");

	try {
		const importedData: BookmarkStorage = JSON.parse(jsonData);

		// Validate imported data structure
		if (!importedData || typeof importedData.bookmarkedProblems !== "object") {
			throw new Error("Invalid JSON structure");
		}

		const currentUserData = await getUserData();

		// Merge with existing data (imported data takes precedence)
		const mergedData: BookmarkStorage = {
			bookmarkedProblems: {
				...currentUserData.bookmarkedProblems,
				...importedData.bookmarkedProblems,
			},
		};

		await saveUserData(mergedData);
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Invalid JSON data for import: ${error.message}`);
		}
		throw new Error("Invalid JSON data for import");
	}
};
