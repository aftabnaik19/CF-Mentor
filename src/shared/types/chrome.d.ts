export interface PageData {
	title: string;
	url: string;
	content: string;
	timestamp: number;
}

export interface ChatMessage {
	id: string;
	type: "user" | "ai";
	content: string;
	timestamp: number;
	context?: PageData;
}

// Define specific message types with proper data typing
export interface AnalyzePageMessage {
	type: "ANALYZE_PAGE";
	data: PageData;
	timestamp: number;
}

export interface PageDataMessage {
	type: "PAGE_DATA";
	data: PageData;
	timestamp: number;
}

export interface ChatMessageMessage {
	type: "CHAT_MESSAGE";
	data: ChatMessage;
	timestamp: number;
}

export interface TogglePanelMessage {
	type: "TOGGLE_PANEL";
	data?: never; // No data needed for toggle
	timestamp: number;
}

// Union type for all possible messages
export type ExtensionMessage =
	| AnalyzePageMessage
	| PageDataMessage
	| ChatMessageMessage
	| TogglePanelMessage;

declare global {
	interface Window {
		__EXTENSION_ID__: string;
	}
}
