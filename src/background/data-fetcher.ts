import { EXTENSION_CONFIG } from "../shared/constants/config";
import {
	MentorData,
	RawContest,
	RawMentorData,
	RawProblem,
	RawSheetProblem,
} from "../shared/types/mentor";
import { saveAllData } from "../shared/utils/indexeddb";

export async function fetchAndStoreData() {
	try {
		const response = await fetch(EXTENSION_CONFIG.API.MENTOR_API_URL);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const rawData: RawMentorData = await response.json();

		// Map snake_case from API to camelCase for our types, based on the exact API response format.
		const data: MentorData = {
			problems: (rawData.problems || [])
				.map((p: RawProblem) => ({
					contestId: p.contest_id,
					index: p.index,
					name: p.name,
					cfRating: p.cf_rating,
					clistRating: p.clist_rating,
					tags: p.tags,
					acceptedCount: p.accepted_count,
					attemptCount: p.attempt_count,
					totalUsers: p.total_users,
					tillDateAccepted: p.till_date_accepted,
					problemDate: p.problem_date,
				}))
				.filter((p) => p.contestId && p.index),

			contests: (rawData.contests || [])
				.map((c: RawContest) => ({
					id: c.id,
					name: c.name,
					rules: c.rules,
					type: c.type,
					durationSeconds: c.duration_seconds,
					startTime: c.start_time,
				}))
				.filter((c) => c.id),

			sheets: (rawData.sheets || []).filter((s) => s.id),

			sheetsProblems: (rawData.sheets_problems || [])
				.map((sp: RawSheetProblem) => ({
					sheetId: sp.sheet_id,
					contestId: sp.contest_id,
					index: sp.index,
				}))
				.filter((sp) => sp.sheetId && sp.contestId && sp.index),
		};

		await saveAllData(data);
		console.log("Data fetched and stored successfully.");
	} catch (error) {
		console.error("Failed to fetch and store data:", error);
	}
}
