import { EXTENSION_CONFIG } from "../shared/constants/config";
import { MentorData } from "../shared/types/mentor";
import { saveAllData } from "../shared/utils/indexedDb";

export async function fetchAndStoreData() {
	try {
		console.log("Attempting to fetch data from API...");
		const response = await fetch(EXTENSION_CONFIG.API.MENTOR_API_URL);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data: MentorData = await response.json();
		console.log(
			`Raw data received: ${data.problems?.length} problems, ${data.contests?.length} contests, ${data.sheets?.length} sheets, ${data.sheetsProblems?.length} sheetsProblems.`
		);

		await saveAllData(data);
		console.log("Data fetched and stored successfully.");

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
