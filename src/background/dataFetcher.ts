import { MentorData, Problem } from "../shared/types/mentor";
import { getData, MENTOR_STORE, saveAllData } from "../shared/utils/indexedDb";
import { apiService } from "./services/ApiService";


export async function fetchAndStoreData() {
	try {
		console.log("Attempting to fetch data from API...");
		const data: MentorData = await apiService.getMentorData();

		console.log(
			`Raw data received: ${data.problems?.length} problems, ${data.contests?.length} contests, ${data.sheets?.length} sheets, ${data.sheetsProblems?.length} sheetsProblems.`
		);

		await saveAllData(data);
		console.log("Data fetched and stored successfully.");

		// Fetch user submissions if handle available
		const result = await chrome.storage.local.get('userHandle');
		if (result.userHandle) {
			try {
				const submissions = await apiService.getUserSubmissions(result.userHandle);

				const verdictMap = new Map();
				for (const sub of submissions) {
					const key = sub.problem.contestId + sub.problem.index;
					if (!verdictMap.has(key)) {
						verdictMap.set(key, sub.verdict);
					} else if (sub.verdict === 'OK') {
						verdictMap.set(key, 'OK');
					}
				}
				console.log('Verdict map size:', verdictMap.size);
				// Update problems with userVerdict
				const problems: Problem[] = await getData(MENTOR_STORE.PROBLEMS);
				const updatedProblems: Problem[] = problems.map((p: Problem) => ({
					...p,
					userVerdict: verdictMap.get((p as any).contestId + p.index) || null
				}));
				await saveAllData({
					problems: updatedProblems,
					contests: await getData(MENTOR_STORE.CONTESTS),
					sheets: await getData(MENTOR_STORE.SHEETS),
					sheetsProblems: await getData(MENTOR_STORE.SHEETS_PROBLEMS)
				});
				console.log('Updated problems with user verdicts');
			} catch (error) {
				console.error('Failed to fetch user submissions:', error);
			}
		}

		// After storing data, use the metadata shipped with the API response
		try {
			const metadata = {
				contestTypes: (data.contestTypes || []).sort(),
				sheetNames: (data.sheets || []).map(s => s.name).sort(),
				problemTags: (data.tags || []).sort(),
			};

			await chrome.storage.local.set({ filterMetadata: metadata });
			console.log("Filter metadata (from API) stored:", metadata);
		} catch (metaError) {
			console.error("Failed to process or store filter metadata from API:", metaError);
		}

		return true;
	} catch (error) {
		console.error("Failed to fetch and store data:", error);
		return false;
	}
}
