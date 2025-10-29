import type { Contest, Problem } from "@/shared/types/mentor";

export type HookArgs = { handle: string | null; k: number | null; by?: "count" | "months" };

export type DataResponsePayload = {
	problems: Problem[];
	contests: Contest[];
};

export type SummaryRow = {
	division: string;
	contests: number;
	// kept for compatibility with current UI; may be hidden in table later
	attemptRatePct: number | null; // attempted / total problems
	acceptanceRatePct: number | null; // solved / attempted
	avgAttempted: number | null; // attempted per contest
	avgSolved: number | null; // solved per contest
	avgRatingDelta: number | null; // rating delta per contest
	avgRank: number | null; // average rank across contests (user)
};

export type CFSubmission = {
	id: number;
	contestId?: number;
	creationTimeSeconds: number;
	relativeTimeSeconds: number;
	verdict?: string;
	problem: { index: string };
	author: { participantType: string };
};

export type CFRatingChange = {
	contestId: number;
	contestName: string;
	ratingUpdateTimeSeconds: number;
	oldRating?: number;
	newRating?: number;
};

export type LetterMetrics = {
	letters: string[]; // fixed order A..G
	// percentage view
	attemptPct: Record<string, number | null>; // per-letter: contests attempted / contests having that letter
	acceptancePct: Record<string, number | null>; // per-letter: contests solved / contests attempted
	// counts view
	attemptCount: Record<string, number>; // number of contests where letter attempted
	acceptanceCount: Record<string, number>; // number of contests where letter solved
	// timing (average seconds)
	indivTimeAvgSec: Record<string, number | null>; // avg time to first solve letter per contest
	cumulTimeAvgSec: Record<string, number | null>; // avg cumulative time up to that letter per contest
};

export type CacheEntry<T> = { data: T; timestamp: number };