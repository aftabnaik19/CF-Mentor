import type { DataResponsePayload } from "./types";

export function connectAndFetchData(): Promise<DataResponsePayload> {
	return new Promise((resolve) => {
		const port = chrome.runtime.connect({ name: "contest-summary-fetch" });
		let resolvedStateReady = false;

		const cleanup = () => {
			try { port.disconnect(); } catch { /* ignore */ }
		};

		port.onMessage.addListener((message: { state?: string; type?: string; payload?: DataResponsePayload }) => {
			console.log("ContestHistorySummary api.ts received message:", message);
			if (!message) {
				console.error("ContestHistorySummary api.ts received NULL message");
				return;
			}
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

export async function fetchJson<T extends { status?: string; result?: unknown; comment?: string }>(url: string): Promise<T> {
	const res = await fetch(url, { credentials: "include" });
	if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
	const data = (await res.json()) as T;
	if (data.status && data.status !== "OK") throw new Error(data.comment || `API error for ${url}`);
	return data;
}



export function safeParseStart(startTime: string | undefined | null): number | null {
	if (!startTime) return null;
	const t = Date.parse(startTime);
	return isNaN(t) ? null : Math.floor(t / 1000);
}