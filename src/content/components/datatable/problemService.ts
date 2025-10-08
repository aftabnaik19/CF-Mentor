import { ProblemFilter } from "../../../shared/types/filters";
import { Contest, Sheet, SheetProblem } from "../../../shared/types/mentor";

// This service now acts as a client to the background service worker,
// which is the single source of truth for all data.

export interface Problem {
	name: string;
	tags: string[];
	index: string;
	cfRating: number | null;
	contestId: number;
	clistRating: number | null;
	problemDate: string; // ISO date string (e.g., "2021-02-23T00:00:00")
	acceptedCount: number;
	tillDateAccepted: number;
	attemptCount: number;
	totalUsers: number;
	attemptPercentage?: number;
	acceptancePercentage?: number;
}

interface DataResponsePayload {
	problems: Problem[];
	contests: Contest[];
	sheets: Sheet[];
	sheetsProblems: SheetProblem[];
}

function applyFilters(
	data: DataResponsePayload,
	filters: ProblemFilter,
): DataResponsePayload {
	let filteredProblems = data.problems;

	// Create maps for efficient lookups
	const contestMap = new Map(data.contests.map((c) => [c.id, c]));
	const sheetMap = new Map(data.sheets.map((s) => [s.id, s]));
	const sheetProblemMap = new Map<string, SheetProblem[]>();
	data.sheetsProblems.forEach((sp) => {
		const key = `${sp.contestId}-${sp.index}`;
		if (!sheetProblemMap.has(key)) {
			sheetProblemMap.set(key, []);
		}
		sheetProblemMap.get(key)!.push(sp);
	});

	// --- Apply each filter ---

	if (filters.cfRating) {
		filteredProblems = filteredProblems.filter(
			(p) =>
				p.cfRating &&
				(!filters.cfRating?.min || p.cfRating >= filters.cfRating.min) &&
				(!filters.cfRating?.max || p.cfRating <= filters.cfRating.max),
		);
	}

	if (filters.clistRating) {
		filteredProblems = filteredProblems.filter(
			(p) =>
				p.clistRating &&
				(!filters.clistRating?.min ||
					p.clistRating >= filters.clistRating.min) &&
				(!filters.clistRating?.max ||
					p.clistRating <= filters.clistRating.max),
		);
	}

	if (filters.tags?.values?.length) {
		filteredProblems = filteredProblems.filter((p) => {
			if (filters.tags?.mode === "and") {
				return filters.tags.values.every((tag) => p.tags.includes(tag));
			}
			return filters.tags?.values.some((tag) => p.tags.includes(tag));
		});
	}

	if (filters.sheets?.values?.length) {
		const sheetIds = Array.from(sheetMap.values())
			.filter((s) => filters.sheets?.values.includes(s.name))
			.map((s) => s.id);

		filteredProblems = filteredProblems.filter((p) => {
			const key = `${p.contestId}-${p.index}`;
			const problemSheets = sheetProblemMap.get(key) || [];
			if (filters.sheets?.mode === "and") {
				return sheetIds.every((id) =>
					problemSheets.some((ps) => ps.sheetId === id),
				);
			}
			return sheetIds.some((id) =>
				problemSheets.some((ps) => ps.sheetId === id),
			);
		});
	}

	if (filters.contestType?.values?.length) {
		filteredProblems = filteredProblems.filter((p) => {
			const contest = contestMap.get(p.contestId);
			if (!contest) return false;

			// Direct equality check is now reliable
			if (filters.contestType?.mode === "and") {
				return filters.contestType.values.every(
					(type) => contest.type === type,
				);
			}
			return filters.contestType?.values.some((type) => contest.type === type);
		});
	}

	if (filters.totalSubmissions) {
		filteredProblems = filteredProblems.filter(
			(p) =>
				(!filters.totalSubmissions?.gte ||
					p.attemptCount >= filters.totalSubmissions.gte) &&
				(!filters.totalSubmissions?.lte ||
					p.attemptCount <= filters.totalSubmissions.lte),
		);
	}

	if (filters.acceptanceRate) {
		filteredProblems = filteredProblems.filter((p) => {
			const rate = p.attemptCount > 0 ? p.acceptedCount / p.attemptCount : 0;
			return (
				(!filters.acceptanceRate?.gte || rate >= filters.acceptanceRate.gte) &&
				(!filters.acceptanceRate?.lte || rate <= filters.acceptanceRate.lte)
			);
		});
	}

	if (filters.attemptRate) {
		filteredProblems = filteredProblems.filter((p) => {
			const rate = p.totalUsers > 0 ? p.attemptCount / p.totalUsers : 0;
			return (
				(!filters.attemptRate?.gte || rate >= filters.attemptRate.gte) &&
				(!filters.attemptRate?.lte || rate <= filters.attemptRate.lte)
			);
		});
	}

	if (filters.problemDate) {
		filteredProblems = filteredProblems.filter((p) => {
			const problemDate = new Date(p.problemDate);
			const after = filters.problemDate?.after
				? new Date(filters.problemDate.after)
				: null;
			const before = filters.problemDate?.before
				? new Date(filters.problemDate.before)
				: null;
			return (!after || problemDate >= after) && (!before || problemDate <= before);
		});
	}

	if (filters.problemIndex?.values?.length) {
		filteredProblems = filteredProblems.filter((p) =>
			filters.problemIndex?.values.includes(p.index),
		);
	}

	if (filters.contestId) {
		filteredProblems = filteredProblems.filter(
			(p) =>
				(!filters.contestId?.gte || p.contestId >= filters.contestId.gte) &&
				(!filters.contestId?.lte || p.contestId <= filters.contestId.lte),
		);
	}

	return { ...data, problems: filteredProblems };
}

export const ProblemService = {
	fetchAndFilterProblems(
		filters: ProblemFilter,
		onStateChange: (state: "FETCHING" | "ERROR") => void,
	): Promise<DataResponsePayload> {
		return new Promise((resolve, reject) => {
			const port = chrome.runtime.connect({ name: "datatable-fetch" });

			port.onDisconnect.addListener(() => {
				// This is a normal event when the extension is reloaded.
				// We check for lastError to avoid logging a scary but harmless error.
				if (chrome.runtime.lastError) {
					console.log(
						"Port disconnected due to extension reload. This is normal.",
					);
					return; // Suppress the error
				}
				reject(new Error("Connection to service worker failed."));
			});

			port.onMessage.addListener((message) => {
				if (message.state) {
					onStateChange(message.state);
					if (message.state === "READY") {
						port.postMessage({ type: "get-data" });
					}
				} else if (message.type === "data-response") {
					const filteredData = applyFilters(message.payload, filters);
					resolve(filteredData);
					port.disconnect();
				}
			});
		});
	},
};
