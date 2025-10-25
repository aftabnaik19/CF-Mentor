/* eslint-disable simple-import-sort/imports */
import type { Contest, Problem } from "@/shared/types/mentor";
import { useEffect, useState } from "react";

type SummaryRow = {
  division: string;
  contests: number;
  attemptRatePct: number | null; // attempted / total problems
  acceptanceRatePct: number | null; // solved / attempted
  avgAttempted: number | null; // attempted per contest
  avgSolved: number | null; // solved per contest
  avgRatingDelta: number | null; // rating delta per contest
};

type LetterMetrics = {
  letters: string[]; // fixed order A..F
  attemptPct: Record<string, number | null>; // per-letter: contests attempted / contests having that letter
  acceptancePct: Record<string, number | null>; // per-letter: contests solved / contests attempted
};

type HookArgs = { handle: string | null; k: number | null };

type DataResponsePayload = {
  problems: Problem[];
  contests: Contest[];
};

function connectAndFetchData(): Promise<DataResponsePayload> {
  return new Promise((resolve) => {
    const port = chrome.runtime.connect({ name: "contest-summary-fetch" });
    let resolvedStateReady = false;

    const cleanup = () => {
      try {
        port.disconnect();
      } catch {
        // ignore disconnect errors
      }
    };

    port.onDisconnect.addListener(() => {
      // ignore disconnects during extension reloads
      if (chrome.runtime.lastError) {
        return;
      }
    });

    port.onMessage.addListener((message: { state?: string; type?: string; payload?: DataResponsePayload }) => {
      if (message.state && message.state === "READY" && !resolvedStateReady) {
        resolvedStateReady = true;
        port.postMessage({ type: "get-data" });
      } else if (message.type === "data-response" && message.payload) {
        const payload = message.payload;
        cleanup();
        resolve({ problems: payload.problems, contests: payload.contests });
      }
    });
  });
}

type CFSubmission = {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  verdict?: string;
  problem: { index: string };
};

type CFRatingChange = {
  contestId: number;
  contestName: string;
  ratingUpdateTimeSeconds: number;
  oldRating?: number;
  newRating?: number;
};

export function useContestSummary({ handle, k }: HookArgs) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [unknownMetaCount, setUnknownMetaCount] = useState(0);
  const [contestsConsidered, setContestsConsidered] = useState(0);
  const [details, setDetails] = useState<Array<{ id: number; name: string; division: string; attempted: number; solved: number }>>([]);
  const [letterByDivision, setLetterByDivision] = useState<Record<string, LetterMetrics>>({});
  const [base, setBase] = useState<{ bg?: DataResponsePayload; rating?: CFRatingChange[]; submissions?: CFSubmission[]; handle?: string } | null>(null);

  // Simple in-memory caches shared across re-renders
  const contestListCacheRef = (globalThis as any).__cfContestListCacheRef || ((globalThis as any).__cfContestListCacheRef = { map: new Map<number, { startTimeSeconds?: number; durationSeconds?: number; name: string }>(), ready: false });
  // Cache contest standings metadata: problem count and indices
  const standingsMetaCacheRef = (globalThis as any).__cfStandingsMetaCacheRef || ((globalThis as any).__cfStandingsMetaCacheRef = new Map<number, { count: number; indices: string[] }>());

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
        // If we already have data for this handle, skip re-fetch
        if (base?.handle === handle && base.bg && base.rating && base.submissions) {
          return; // compute pass below will run in the next effect
        }
        const [bg, ratingHistory, submissions] = await Promise.all([
          connectAndFetchData(),
          fetchJson<{ status: string; result: CFRatingChange[] }>(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`),
          fetchJson<{ status: string; result: CFSubmission[] }>(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1`),
        ]);
        if (cancelled) return;
        setBase({ bg, rating: ratingHistory.result || [], submissions: submissions.result || [], handle });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [handle]);

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
        const { problems, contests } = base.bg;
        const allContestsMap = new Map<number, Contest>(contests.map((c) => [c.id, c]));
        const problemsByContest = new Map<number, number>();
        const lettersByContest = new Map<number, Set<string>>();
        const LETTERS = ["A", "B", "C", "D", "E", "F"];
        problems.forEach((p) => {
          problemsByContest.set(p.contestId, (problemsByContest.get(p.contestId) || 0) + 1);
          const idx = typeof p.index === "string" && p.index.length > 0 ? p.index[0] : "";
          if (LETTERS.includes(idx)) {
            if (!lettersByContest.has(p.contestId)) lettersByContest.set(p.contestId, new Set<string>());
            lettersByContest.get(p.contestId)!.add(idx);
          }
        });

        const ratedAll = base.rating || [];
        // Partition by division and take last k for each division
        const byDiv: Map<string, CFRatingChange[]> = new Map();
        for (const r of ratedAll) {
          const div = parseDivision(r.contestName);
          if (!byDiv.has(div)) byDiv.set(div, []);
          byDiv.get(div)!.push(r);
        }
        const selected: CFRatingChange[] = [];
  for (const [, arr] of byDiv.entries()) {
          const subset = k && k > 0 ? arr.slice(-k) : arr.slice();
          // Keep order consistent across divisions (append)
          for (const r of subset) selected.push(r);
        }
        // Unique contest ids considered across all divisions
        const contestIdsSet = new Set<number>(selected.map((r) => r.contestId));
        setContestsConsidered(contestIdsSet.size);

        const contestIds = contestIdsSet;
        // Build meta per contest
        const meta = new Map<number, { start: number | null; end: number | null; division: string; totalProblems: number | null; name: string }>();
        const missingTime: number[] = [];
        const missingTotal: number[] = [];
        for (const r of selected) {
          const c = allContestsMap.get(r.contestId);
          const div = parseDivision(r.contestName);
          if (c) {
            const start = safeParseStart(c.startTime);
            const end = start != null && c.durationSeconds != null ? start + c.durationSeconds : null;
            const total = problemsByContest.get(c.id) ?? null;
            if (start == null || end == null) missingTime.push(r.contestId);
            if (total == null) missingTotal.push(r.contestId);
            meta.set(r.contestId, { start, end, division: div, totalProblems: total, name: c.name });
          } else {
            missingTime.push(r.contestId);
            missingTotal.push(r.contestId);
            meta.set(r.contestId, { start: null, end: null, division: div, totalProblems: null, name: r.contestName });
          }
        }

        // Fallback 1: Fill missing time via contest.list
        if (missingTime.length > 0) {
          if (!contestListCacheRef.ready) {
            try {
              const contestList = await fetchJson<{ status: string; result: Array<{ id: number; name: string; startTimeSeconds?: number; durationSeconds?: number }> }>(
                `https://codeforces.com/api/contest.list?gym=false`
              );
              contestList.result.forEach((c) => contestListCacheRef.map.set(c.id, { startTimeSeconds: c.startTimeSeconds, durationSeconds: c.durationSeconds, name: c.name }));
              contestListCacheRef.ready = true;
            } catch {
              // ignore
            }
          }
          for (const cid of missingTime) {
            const m = meta.get(cid);
            const cl = contestListCacheRef.map.get(cid);
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
            if (standingsMetaCacheRef.has(cid)) {
              const metaEntry = standingsMetaCacheRef.get(cid)!;
              m.totalProblems = metaEntry.count;
            } else {
              const st = await fetchJson<{ status: string; result: { problems: Array<{ index?: string }> } }>(
                `https://codeforces.com/api/contest.standings?contestId=${cid}&from=1&count=1`
              );
              const indices: string[] = Array.isArray(st.result?.problems) ? st.result.problems.map((x) => (x?.index ?? "")).filter(Boolean) as string[] : [];
              const cnt = indices.length || null;
              if (typeof cnt === "number") {
                standingsMetaCacheRef.set(cid, { count: cnt, indices });
              }
              m.totalProblems = cnt;
              // populate lettersByContest from standings if missing in mentor problems
              if (!lettersByContest.has(cid) && indices.length > 0) {
                const set = new Set<string>();
                for (const idx of indices) {
                  const ch = idx[0];
                  if (LETTERS.includes(ch)) set.add(ch);
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
        for (const cid of selected.map(r => r.contestId)) {
          const m = meta.get(cid)!;
          if (m.start == null || m.end == null || m.totalProblems == null) unknown++;
        }
        setUnknownMetaCount(unknown);

        // submissions filtered
        const subs = base.submissions || [];
        type PerContest = {
          attempted: Set<string>; // raw indices (e.g., A, A1)
          solved: Set<string>; // raw indices
        };
        const perContest = new Map<number, PerContest>();
        for (const s of subs) {
          const cid = s.contestId;
          if (!cid || !contestIds.has(cid)) continue;
          const m = meta.get(cid)!;
          // only submissions during contest if we know window
          if (m.start != null && m.end != null) {
            if (s.creationTimeSeconds < m.start || s.creationTimeSeconds > m.end) continue;
          }
          const key = s.problem?.index || "";
          if (!perContest.has(cid)) perContest.set(cid, { attempted: new Set(), solved: new Set() });
          const rec = perContest.get(cid)!;
          rec.attempted.add(key);
          if (s.verdict === "OK") {
            rec.solved.add(key);
          }
        }

        // aggregate per division
        const byDivision = new Map<string, { contests: number; attempted: number; solved: number; totalProblems: number; haveTotalCount: number; ratingDeltaSum: number; haveDeltaCount: number }>();
        // per-letter aggregates per division
        const letterAggByDivision = new Map<string, { denom: Record<string, number>; attempted: Record<string, number>; accepted: Record<string, number> }>();
        for (const r of selected) {
          const cid = r.contestId;
          const m = meta.get(cid)!;
          const rec = perContest.get(cid) || { attempted: new Set(), solved: new Set() };
          const key = m.division;
          if (!byDivision.has(key)) byDivision.set(key, { contests: 0, attempted: 0, solved: 0, totalProblems: 0, haveTotalCount: 0, ratingDeltaSum: 0, haveDeltaCount: 0 });
          const agg = byDivision.get(key)!;
          agg.contests += 1;
          agg.attempted += rec.attempted.size;
          agg.solved += rec.solved.size;
          if (m.totalProblems != null) { agg.totalProblems += m.totalProblems; agg.haveTotalCount += 1; }
          if (typeof r.oldRating === "number" && typeof r.newRating === "number") {
            agg.ratingDeltaSum += (r.newRating - r.oldRating);
            agg.haveDeltaCount += 1;
          }

          // per-letter aggregates
          if (!letterAggByDivision.has(key)) {
            const init = { denom: {} as Record<string, number>, attempted: {} as Record<string, number>, accepted: {} as Record<string, number> };
            for (const L of LETTERS) { init.denom[L] = 0; init.attempted[L] = 0; init.accepted[L] = 0; }
            letterAggByDivision.set(key, init);
          }
          const ladd = letterAggByDivision.get(key)!;
          // determine letters present in this contest
          const lettersPresent = lettersByContest.get(cid) ?? (() => {
            const metaEntry = standingsMetaCacheRef.get(cid);
            if (!metaEntry) return undefined;
            const set = new Set<string>();
            for (const idx of metaEntry.indices) {
              const ch = idx[0];
              if (LETTERS.includes(ch)) set.add(ch);
            }
            return set;
          })();
          if (lettersPresent && lettersPresent.size > 0) {
            // derive attempted/solved letters (by first char)
            const attemptedLetters = new Set<string>();
            for (const idx of rec.attempted) {
              const ch = idx[0];
              if (LETTERS.includes(ch)) attemptedLetters.add(ch);
            }
            const solvedLetters = new Set<string>();
            for (const idx of rec.solved) {
              const ch = idx[0];
              if (LETTERS.includes(ch)) solvedLetters.add(ch);
            }
            for (const L of lettersPresent) {
              ladd.denom[L] += 1;
              if (attemptedLetters.has(L)) ladd.attempted[L] += 1;
              if (solvedLetters.has(L)) ladd.accepted[L] += 1;
            }
          }
        }

        const rows: SummaryRow[] = Array.from(byDivision.entries()).map(([division, agg]) => {
          const attemptRatePct = agg.haveTotalCount > 0 && agg.totalProblems > 0 ? (100 * agg.attempted) / agg.totalProblems : null;
          const acceptanceRatePct = agg.attempted > 0 ? (100 * agg.solved) / agg.attempted : null;
          const avgAttempted = agg.contests > 0 ? agg.attempted / agg.contests : null;
          const avgSolved = agg.contests > 0 ? agg.solved / agg.contests : null;
          const avgRatingDelta = agg.haveDeltaCount > 0 ? agg.ratingDeltaSum / agg.haveDeltaCount : null;
          return { division, contests: agg.contests, attemptRatePct, acceptanceRatePct, avgAttempted, avgSolved, avgRatingDelta };
        }).sort((a, b) => a.division.localeCompare(b.division));

        if (!cancelled) setSummary(rows);

        // build per-letter metrics per division
        const byDivOut: Record<string, LetterMetrics> = {};
        for (const [division, agg] of letterAggByDivision.entries()) {
          const attemptPct: Record<string, number | null> = {};
          const acceptancePct: Record<string, number | null> = {};
          for (const L of LETTERS) {
            const denom = agg.denom[L];
            const a = agg.attempted[L];
            const s = agg.accepted[L];
            attemptPct[L] = denom > 0 ? (100 * a) / denom : null;
            acceptancePct[L] = a > 0 ? (100 * s) / a : null;
          }
          byDivOut[division] = { letters: LETTERS, attemptPct, acceptancePct };
        }
        if (!cancelled) setLetterByDivision(byDivOut);

        // Build per-contest details for the UI
        const det: Array<{ id: number; name: string; division: string; attempted: number; solved: number }> = [];
        for (const r of selected) {
          const cid = r.contestId;
          const m = meta.get(cid)!;
          const rec = perContest.get(cid) || { attempted: new Set(), solved: new Set() };
          det.push({ id: cid, name: m.name, division: m.division, attempted: rec.attempted.size, solved: rec.solved.size });
        }
        if (!cancelled) setDetails(det);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    compute();
    return () => { cancelled = true; };
  }, [handle, k, base]);

  return { loading, error, summary, unknownMetaCount, contestsConsidered, details, letterByDivision };
}

function parseDivision(name: string): string {
  const m = /Div\.?\s*(\d)/i.exec(name);
  if (m) return `Div. ${m[1]}`;
  if (/Educational/i.test(name)) return "Educational";
  return "Other";
}

function safeParseStart(startTime: string | undefined | null): number | null {
  if (!startTime) return null;
  const t = Date.parse(startTime);
  return isNaN(t) ? null : Math.floor(t / 1000);
}

async function fetchJson<T extends { status?: string; result?: unknown; comment?: string }>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const data = (await res.json()) as T;
  if (data.status && data.status !== "OK") throw new Error(data.comment || `API error for ${url}`);
  return data;
}

export type { SummaryRow, LetterMetrics };
