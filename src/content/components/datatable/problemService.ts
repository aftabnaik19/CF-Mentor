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

let port: chrome.runtime.Port | null = null;

function connect() {
	if (port) return port;
	port = chrome.runtime.connect({ name: "datatable" });
	return port;
}

interface DataResponsePayload {
	problems: Problem[];
	contests: Contest[];
	sheets: Sheet[];
	sheetsProblems: SheetProblem[];
}

interface DataResponseMessage {
	type: "data-response";
	payload: DataResponsePayload;
}

export const ProblemService = {
	getProblems(port: chrome.runtime.Port): Promise<DataResponsePayload> {
		return new Promise((resolve) => {
			const listener = (message: DataResponseMessage) => {
				if (message.type === "data-response") {
					port.onMessage.removeListener(listener); // Clean up listener
					resolve(message.payload);
				}
			};
			port.onMessage.addListener(listener);
			port.postMessage({ type: "get-data" });
		});
	},

	listenToState(callback: (state: string) => void): chrome.runtime.Port {
		const port = connect();
		port.onMessage.addListener((message) => {
			if (message.state) {
				callback(message.state);
			}
		});
		return port;
	},
};
