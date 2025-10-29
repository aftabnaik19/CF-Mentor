/* eslint-disable simple-import-sort/imports */
import { useEffect, useState } from "react";
import { connectAndFetchData } from "./api";
import { computeSummaries } from "./processing";
import type { CFSubmission, CFRatingChange, DataResponsePayload, HookArgs, LetterMetrics, SummaryRow } from "./types";

export function useContestSummary({ handle, k, by = "count" }: HookArgs) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [summary, setSummary] = useState<SummaryRow[]>([]);
	const [unknownMetaCount, setUnknownMetaCount] = useState(0);
	const [contestsConsidered, setContestsConsidered] = useState(0);
	const [details, setDetails] = useState<Array<{ id: number; name: string; division: string; attempted: number; solved: number }>>([]);
	const [letterByDivision, setLetterByDivision] = useState<Record<string, LetterMetrics>>({});
	const [base, setBase] = useState<{ bg?: DataResponsePayload; rating?: CFRatingChange[]; submissions?: CFSubmission[]; handle?: string } | null>(null);

	// Global base cache to avoid re-fetching on remount (e.g., modal open/close)
	type AppGlobal = typeof globalThis & {
		__cfSummaryBaseCacheRef?: Map<string, { bg: DataResponsePayload; rating: CFRatingChange[]; submissions: CFSubmission[] }>;
	};

	// Simple in-memory caches shared across re-renders
	const g = globalThis as AppGlobal;
	const baseCacheRef = g.__cfSummaryBaseCacheRef || (g.__cfSummaryBaseCacheRef = new Map());

 	// Fetch heavy data only when handle changes (or first load)
 	useEffect(() => {
 		let cancelled = false;
 			async function run() {
 			if (!handle) return;
 			setLoading(true);
 			setError(null);
 			setSummary([]);
 			setUnknownMetaCount(0);
 			setLetterByDivision({});
 			try {
 					// Use cached base if available
 					const cached = baseCacheRef.get(handle);
 					if (cached) {
 						if (!cancelled) setBase({ bg: cached.bg, rating: cached.rating, submissions: cached.submissions, handle });
 						return;
 					}
 					const bg = await connectAndFetchData();
 					// Fetch user data via background script
 					const userDataResponse = await new Promise<{ success: boolean; rating?: CFRatingChange[]; submissions?: CFSubmission[]; error?: string }>((resolve) => {
 						chrome.runtime.sendMessage({ type: "fetch-user-data", handle }, (response) => {
 							resolve(response);
 						});
 					});
 					if (!userDataResponse.success) {
 						throw new Error(userDataResponse.error || "Failed to fetch user data");
 					}
 					const ratingHistory = userDataResponse.rating as CFRatingChange[];
 					const submissions = userDataResponse.submissions as CFSubmission[];
 					if (cancelled) return;
 					const packed = { bg, rating: ratingHistory, submissions };
 					baseCacheRef.set(handle, packed);
 					setBase({ ...packed, handle });
 			} catch (e) {
 				const msg = e instanceof Error ? e.message : String(e);
 				if (!cancelled) setError(msg);
 			} finally {
 				if (!cancelled) setLoading(false);
 			}
 		}
 		run();
 		return () => { cancelled = true; };
 	}, [handle, baseCacheRef]);

	// Compute summaries when k or base data changes; do NOT re-fetch APIs
	useEffect(() => {
		let cancelled = false;
		async function compute() {
			if (!handle || !base?.bg || !base.rating || !base.submissions) return;
			setLoading(true);
			setError(null);
			setSummary([]);
			setUnknownMetaCount(0);
			setLetterByDivision({});
			try {
				await computeSummaries({ bg: base.bg!, rating: base.rating!, submissions: base.submissions! }, k, by, setSummary, setUnknownMetaCount, setContestsConsidered, setLetterByDivision, setDetails);
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				if (!cancelled) setError(msg);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		compute();
		return () => { cancelled = true; };
	}, [handle, k, by, base]);

	return { loading, error, summary, unknownMetaCount, contestsConsidered, details, letterByDivision };
}

export type { LetterMetrics, SummaryRow };
