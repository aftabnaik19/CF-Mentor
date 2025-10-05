export const EXTENSION_CONFIG = {
	STORAGE_KEYS: {
		CHAT_HISTORY: "chatHistory",
		USER_PREFERENCES: "userPreferences",
		PAGE_CONTEXT: "pageContext",
	},
	API: {
		BASE_URL: "https://api.openai.com/v1",
		MENTOR_API_URL: "https://api.cf-mentor.me/data",
		TIMEOUT: 30000,
	},
	UI: {
		PANEL_WIDTH: 400,
		ANIMATION_DURATION: 200,
	},
} as const;
