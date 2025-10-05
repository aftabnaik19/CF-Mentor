import { EXTENSION_CONFIG } from "../shared/constants/config";
import { MentorData } from "../shared/types/mentor";
import { saveAllData } from "../shared/utils/indexeddb";

export async function fetchAndStoreData() {
	try {
		const response = await fetch(EXTENSION_CONFIG.API.MENTOR_API_URL);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const rawData = await response.json();

		// Ensure all data arrays exist, providing empty arrays as a fallback.
		const data: MentorData = {
			problems: rawData.problems || [],
			contests: rawData.contests || [],
			sheets: rawData.sheets || [],
			sheets_problems: rawData.sheets_problems || [],
		};

		await saveAllData(data);
		console.log("Data fetched and stored successfully.");
	} catch (error) {
		console.error("Failed to fetch and store data:", error);
	}
}
