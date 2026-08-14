// types/bookmark.ts
export interface BookmarkedProblem {
	contestId: string;
	problemIdx: string;
	difficultyRating: number | null; // User-selected 1-5 rating
	notes: string | null;
	timeRequiredSeconds: number | null;
	problemRating: string | null; // e.g., "*1100" from tags
	problemTags: string[];
	bookmarkedAt: number; // timestamp
	lastUpdated: number; // timestamp
}

export interface BookmarkStorage {
	bookmarkedProblems: { [key: string]: BookmarkedProblem }; // key: "contestId-problemIdx"
}
