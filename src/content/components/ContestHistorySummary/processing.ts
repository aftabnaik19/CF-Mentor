import type { Contest, Problem } from "@/shared/types/mentor";

import { fetchJson, safeParseStart } from "./api";
import type { CFRatingChange, CFSubmission, LetterMetrics, SummaryRow } from "./types";

declare global {
  var __cfContestListCacheRef: { map: Map<number, { startTimeSeconds?: number; durationSeconds?: number; name: string }>; ready: boolean } | undefined;
  var __cfStandingsMetaCacheRef: Map<number, { count: number; indices: string[] }> | undefined;
}

export async function computeSummaries(
	base: { bg: { problems: Problem[]; contests: Contest[] }; rating: CFRatingChange[]; submissions: CFSubmission[] },
	k: number | null,
	by: "count" | "months",
	setSummary: (summary: SummaryRow[]) => void,
	setUnknownMetaCount: (count: number) => void,
	setContestsConsidered: (count: number) => void,
	setLetterByDivision: (data: Record<string, LetterMetrics>) => void,
	setDetails: (details: Array<{ id: number; name: string; division: string; attempted: number; solved: number }>) => void
) {
	const { problems, contests } = base.bg;
	const allContestsMap = new Map<number, Contest>(contests.map((c) => [c.id, c]));
	const problemsByContest = new Map<number, number>();
	const lettersByContest = new Map<number, Set<string>>();
	const LETTERS = ["A", "B", "C", "D", "E", "F", "G"];
	problems.forEach((p) => {
		problemsByContest.set(p.contestId, (problemsByContest.get(p.contestId) || 0) + 1);
		const idx = typeof p.index === "string" && p.index.length > 0 ? p.index[0] : "";
		if (LETTERS.includes(idx)) {
			if (!lettersByContest.has(p.contestId)) lettersByContest.set(p.contestId, new Set<string>());
			lettersByContest.get(p.contestId)!.add(idx);
		}
	});

	const ratedAll = base.rating || [];
	let selectedRatings: CFRatingChange[];
	const nowSec = Math.floor(Date.now() / 1000);
	if (by === "months" && k && k > 0) {
		const monthsSec = k * 30 * 24 * 60 * 60; // approx
		const cutoff = nowSec - monthsSec;
		// Partition by division, filter by time, take last k per division
		const tempByDiv: Map<string, CFRatingChange[]> = new Map();
		for (const r of ratedAll) {
			if ((r.ratingUpdateTimeSeconds || 0) >= cutoff) {
				const c = allContestsMap.get(r.contestId);
				if (!c) continue;
				const div = c.type;
				if (!tempByDiv.has(div)) tempByDiv.set(div, []);
				tempByDiv.get(div)!.push(r);
			}
		}
		selectedRatings = [];
		for (const [, arr] of tempByDiv.entries()) {
			const subset = arr.slice(-k); // last k in time
			selectedRatings.push(...subset);
		}
	} else {
		// For count mode, partition by division and take last k
		const byDiv: Map<string, CFRatingChange[]> = new Map();
		for (const r of ratedAll) {
			const c = allContestsMap.get(r.contestId);
			if (!c) continue;
			const div = c.type;
			if (!byDiv.has(div)) byDiv.set(div, []);
			byDiv.get(div)!.push(r);
		}
		selectedRatings = [];
		for (const [, arr] of byDiv.entries()) {
			const subset = k && k > 0 ? arr.slice(-k) : arr.slice();
			selectedRatings.push(...subset);
		}
	}

	const selectedContests = selectedRatings.map((r) => allContestsMap.get(r.contestId)).filter(Boolean) as Contest[];

	const contestIdsSet = new Set<number>(selectedContests.map((c) => c.id));
	setContestsConsidered(contestIdsSet.size);

	const contestIds = contestIdsSet;
	// Build meta per contest
	// Helper to normalize division names
	const normalizeDivision = (type: string): string => {
		const t = type.trim();
		if (t.includes("Div. 1") && t.includes("Div. 2")) return "Div. 1 + Div. 2";
		if (t.includes("Hello") || t.includes("Good Bye") || t.includes("Goodbye")) return "Div. 1 + Div. 2";
		if (t.includes("Global")) return "Global";
		if (t.includes("Educational") || t.includes("Edu")) return "Div. 2 (Educational)";
		if (t.includes("Div. 1")) return "Div. 1";
		if (t.includes("Div. 2")) return "Div. 2";
		if (t.includes("Div. 3")) return "Div. 3";
		if (t.includes("Div. 4")) return "Div. 4";
		return t; // Fallback
	};

	const divisionOrder: Record<string, number> = {
		"Global": 1,
		"Div. 1 + Div. 2": 2,
		"Div. 1": 3,
		"Div. 2": 4,
		"Div. 2 (Educational)": 5,
		"Div. 3": 6,
		"Div. 4": 7
	};

	const getDivisionOrder = (div: string): number => {
		return divisionOrder[div] || 99;
	};

	const meta = new Map<number, { start: number | null; end: number | null; division: string; totalProblems: number | null; name: string }>();
	const missingTime: number[] = [];
	const missingTotal: number[] = [];
	const ratingByContest = new Map<number, CFRatingChange>(selectedRatings.map((r) => [r.contestId, r]));
	for (const c of selectedContests) {
		const div = normalizeDivision(c.type); // Normalize here
		const start = safeParseStart(c.startTime);
		const end = start != null && c.durationSeconds != null ? start + c.durationSeconds : null;
		const total = problemsByContest.get(c.id) ?? null;
		if (start == null || end == null) missingTime.push(c.id);
		if (total == null) missingTotal.push(c.id);
		meta.set(c.id, { start, end, division: div, totalProblems: total, name: c.name });
	}

	// ... (rest of the file until sorting)

	// Fallback 1: Fill missing time via contest.list
	if (missingTime.length > 0) {
		if (!globalThis.__cfContestListCacheRef?.ready) {
			try {
				const contestList = await fetchJson<{ status: string; result: Array<{ id: number; name: string; startTimeSeconds?: number; durationSeconds?: number }> }>(
					`https://codeforces.com/api/contest.list?gym=false`
				);
				globalThis.__cfContestListCacheRef = { map: new Map(), ready: false };
				contestList.result.forEach((c) => globalThis.__cfContestListCacheRef!.map.set(c.id, { startTimeSeconds: c.startTimeSeconds, durationSeconds: c.durationSeconds, name: c.name }));
				globalThis.__cfContestListCacheRef.ready = true;
			} catch {
				// ignore
			}
		}
		for (const cid of missingTime) {
			const m = meta.get(cid);
			const cl = globalThis.__cfContestListCacheRef?.map.get(cid);
			if (m && cl && cl.startTimeSeconds && cl.durationSeconds) {
				m.start = cl.startTimeSeconds;
				m.end = cl.startTimeSeconds + cl.durationSeconds;
				if (!m.name) m.name = cl.name;
			}
		}
	}

	// Fallback 2: Fill missing total problems via contest.standings (only for those still missing)
	for (const cid of missingTotal) {
		const m = meta.get(cid)!;
		if (m.totalProblems != null) continue;
		try {
			if (globalThis.__cfStandingsMetaCacheRef?.has(cid)) {
				const metaEntry = globalThis.__cfStandingsMetaCacheRef.get(cid)!;
				m.totalProblems = metaEntry.count;
			} else {
				const st = await fetchJson<{ status: string; result: { problems: Array<{ index?: string }> } }>(
					`https://codeforces.com/api/contest.standings?contestId=${cid}&from=1&count=1`
				);
				const indices: string[] = Array.isArray(st.result?.problems) ? st.result.problems.map((x) => (x?.index ?? "")).filter(Boolean) as string[] : [];
				const cnt = indices.length || null;
				if (typeof cnt === "number") {
					(globalThis.__cfStandingsMetaCacheRef ||= new Map()).set(cid, { count: cnt, indices });
				}
				m.totalProblems = cnt;
				if (!lettersByContest.has(cid) && indices.length > 0) {
					const set = new Set<string>();
					for (const idx of indices) {
						const ch = idx[0];
						if (["A","B","C","D","E","F","G"].includes(ch)) set.add(ch);
					}
					if (set.size > 0) lettersByContest.set(cid, set);
				}
			}
		} catch {
			// ignore failures, keep null
		}
	}

				// Count remaining unknowns for UI note
				let unknown = 0;
				for (const cid of selectedContests.map(c => c.id)) {
					const m = meta.get(cid)!;
					if (m.start == null || m.end == null || m.totalProblems == null) unknown++;
				}
				setUnknownMetaCount(unknown);

	// submissions filtered
	const subs = base.submissions || [];
	type PerContest = {
		attempted: Set<string>; // raw indices (e.g., A, A1)
		solved: Set<string>; // raw indices
		okTimeByLetter: Map<string, number>; // seconds from start for first OK per letter
	};
	const perContest = new Map<number, PerContest>();
	for (const s of subs) {
		const cid = s.contestId;
		if (!cid || !contestIds.has(cid)) continue;
		// Exclude virtual contests
		if (s.author?.participantType === "VIRTUAL") continue;
		const m = meta.get(cid)!;
		// only submissions during contest if we know window
		if (m.start != null && m.end != null) {
			if (s.creationTimeSeconds < m.start || s.creationTimeSeconds > m.end) continue;
		}
		const key = s.problem?.index || "";
		if (!perContest.has(cid)) perContest.set(cid, { attempted: new Set(), solved: new Set(), okTimeByLetter: new Map() });
		const rec = perContest.get(cid)!;
		rec.attempted.add(key);
		if (s.verdict === "OK") {
			rec.solved.add(key);
			const ch = key[0];
			if (["A","B","C","D","E","F","G"].includes(ch) && m.start != null) {
				const t = s.creationTimeSeconds - m.start;
				const prev = rec.okTimeByLetter.get(ch);
				if (prev == null || t < prev) rec.okTimeByLetter.set(ch, t);
			}
		}
	}

	// aggregate per division (and combined Div.1+Div. 2)
	const byDivision = new Map<string, { contests: number; attempted: number; solved: number; totalProblems: number; haveTotalCount: number; ratingDeltaSum: number; haveDeltaCount: number; rankSum: number; rankCount: number }>();
	// per-letter aggregates per division
	const letterAggByDivision = new Map<string, { denom: Record<string, number>; attempted: Record<string, number>; accepted: Record<string, number>; indivSum: Record<string, number>; indivCnt: Record<string, number>; cumulSum: Record<string, number>; cumulCnt: Record<string, number> }>();

				for (const c of selectedContests) {
					const r = ratingByContest.get(c.id)!;
		const cid = r.contestId;
		const m = meta.get(cid)!;
		const rec = perContest.get(cid) || { attempted: new Set(), solved: new Set(), okTimeByLetter: new Map() };
					const keys = [m.division];

		for (const keyDiv of keys) {
			if (!byDivision.has(keyDiv)) byDivision.set(keyDiv, { contests: 0, attempted: 0, solved: 0, totalProblems: 0, haveTotalCount: 0, ratingDeltaSum: 0, haveDeltaCount: 0, rankSum: 0, rankCount: 0 });
			const agg = byDivision.get(keyDiv)!;
			agg.contests += 1;
			agg.attempted += rec.attempted.size;
			agg.solved += rec.solved.size;
			if (m.totalProblems != null) { agg.totalProblems += m.totalProblems; agg.haveTotalCount += 1; }
			if (typeof r.oldRating === "number" && typeof r.newRating === "number") {
				agg.ratingDeltaSum += (r.newRating - r.oldRating);
				agg.haveDeltaCount += 1;
			}
						if (typeof r.rank === "number") {
							agg.rankSum += r.rank;
							agg.rankCount += 1;
						}
		}

		// Initialize letter aggregators for both keys
		for (const keyDiv of keys) {
			if (!letterAggByDivision.has(keyDiv)) {
				const init = { denom: {} as Record<string, number>, attempted: {} as Record<string, number>, accepted: {} as Record<string, number>, indivSum: {} as Record<string, number>, indivCnt: {} as Record<string, number>, cumulSum: {} as Record<string, number>, cumulCnt: {} as Record<string, number> };
				for (const L of LETTERS) { init.denom[L] = 0; init.attempted[L] = 0; init.accepted[L] = 0; init.indivSum[L] = 0; init.indivCnt[L] = 0; init.cumulSum[L] = 0; init.cumulCnt[L] = 0; }
				letterAggByDivision.set(keyDiv, init);
			}
		}

		const laddTargets = keys.map((kdiv) => letterAggByDivision.get(kdiv)!);
		// determine letters present in this contest
		const lettersPresent = lettersByContest.get(cid) ?? (() => {
			const metaEntry = globalThis.__cfStandingsMetaCacheRef?.get(cid);
			if (!metaEntry) return undefined;
			const set = new Set<string>();
			for (const idx of metaEntry.indices) {
				const ch = idx[0];
				if (["A","B","C","D","E","F","G"].includes(ch)) set.add(ch);
			}
			return set;
		})();
		if (lettersPresent && lettersPresent.size > 0) {
			const attemptedLetters = new Set<string>();
			for (const idx of rec.attempted) {
				const ch = idx[0];
				if (["A","B","C","D","E","F","G"].includes(ch)) attemptedLetters.add(ch);
			}
			const solvedLetters = new Set<string>();
			for (const idx of rec.solved) {
				const ch = idx[0];
				if (["A","B","C","D","E","F","G"].includes(ch)) solvedLetters.add(ch);
			}
						const okTime = rec.okTimeByLetter || new Map<string, number>();
						const cumulByLetter: Record<string, number> = {};
						// Sort solved letters by solve time
						const solvedWithTimes = Array.from(okTime.entries()).sort((a, b) => a[1] - b[1]);
						let cumul = 0;
						for (const [L, t] of solvedWithTimes) {
							cumul += t;
							cumulByLetter[L] = cumul;
						}
						// For unsolved, set NaN
						for (const L of LETTERS) {
							if (!okTime.has(L)) cumulByLetter[L] = NaN;
						}
			for (const ladd of laddTargets) {
				for (const L of lettersPresent) {
					ladd.denom[L] += 1;
					if (attemptedLetters.has(L)) ladd.attempted[L] += 1;
					if (solvedLetters.has(L)) ladd.accepted[L] += 1;
					const t = okTime.get(L);
					if (t != null) { ladd.indivSum[L] += t; ladd.indivCnt[L] += 1; }
					const c = cumulByLetter[L];
					if (!Number.isNaN(c)) { ladd.cumulSum[L] += c; ladd.cumulCnt[L] += 1; }
				}
			}
		}
	}

	const rows: SummaryRow[] = Array.from(byDivision.entries()).map(([division, agg]) => {
		const attemptRatePct = agg.haveTotalCount > 0 && agg.totalProblems > 0 ? (100 * agg.attempted) / agg.totalProblems : null;
		const acceptanceRatePct = agg.attempted > 0 ? (100 * agg.solved) / agg.attempted : null;
		const avgAttempted = agg.contests > 0 ? agg.attempted / agg.contests : null;
		const avgSolved = agg.contests > 0 ? agg.solved / agg.contests : null;
		const avgRatingDelta = agg.haveDeltaCount > 0 ? agg.ratingDeltaSum / agg.haveDeltaCount : null;
		const avgRank = agg.rankCount > 0 ? agg.rankSum / agg.rankCount : null;
		return { division, contests: agg.contests, attemptRatePct, acceptanceRatePct, avgAttempted, avgSolved, avgRatingDelta, avgRank };
	}).sort((a, b) => {
		const orderA = getDivisionOrder(a.division);
		const orderB = getDivisionOrder(b.division);
		if (orderA !== orderB) return orderA - orderB;
		return a.division.localeCompare(b.division);
	});

	setSummary(rows);

	// build per-letter metrics per division
	const byDivOut: Record<string, LetterMetrics> = {};
	for (const [division, agg] of letterAggByDivision.entries()) {
		const attemptPct: Record<string, number | null> = {};
		const acceptancePct: Record<string, number | null> = {};
		const attemptCount: Record<string, number> = {};
		const acceptanceCount: Record<string, number> = {};
		const indivTimeAvgSec: Record<string, number | null> = {};
		const cumulTimeAvgSec: Record<string, number | null> = {};
		for (const L of LETTERS) {
			const denom = agg.denom[L];
			const a = agg.attempted[L];
			const s = agg.accepted[L];
			attemptPct[L] = denom > 0 ? (100 * a) / denom : null;
			acceptancePct[L] = a > 0 ? (100 * s) / a : null;
			attemptCount[L] = a || 0;
			acceptanceCount[L] = s || 0;
			indivTimeAvgSec[L] = agg.indivCnt[L] > 0 ? agg.indivSum[L] / agg.indivCnt[L] : null;
			cumulTimeAvgSec[L] = agg.cumulCnt[L] > 0 ? agg.cumulSum[L] / agg.cumulCnt[L] : null;
		}
		byDivOut[division] = { letters: LETTERS, attemptPct, acceptancePct, attemptCount, acceptanceCount, indivTimeAvgSec, cumulTimeAvgSec };
	}
	setLetterByDivision(byDivOut);

				// Build per-contest details for the UI (kept for compatibility; caller may ignore)
				const det: Array<{ id: number; name: string; division: string; attempted: number; solved: number }> = [];
				for (const c of selectedContests) {
					const cid = c.id;
					const m = meta.get(cid)!;
					const rec = perContest.get(cid) || { attempted: new Set(), solved: new Set(), okTimeByLetter: new Map() };
					det.push({ id: cid, name: m.name, division: m.division, attempted: rec.attempted.size, solved: rec.solved.size });
				}
				setDetails(det);
}