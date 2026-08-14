export interface FilterMetadata {
  contestTypes: string[];
  sheetNames: string[];
  problemTags: string[];
}

export const metadataService = {
  async getFilterMetadata(): Promise<FilterMetadata | null> {
    try {
      const result = await chrome.storage.local.get("filterMetadata");
      return result.filterMetadata || null;
    } catch (error) {
      console.error("Failed to retrieve filter metadata:", error);
      return null;
    }
  },
};
