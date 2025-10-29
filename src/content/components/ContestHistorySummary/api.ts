import type { DataResponsePayload } from "./types";

export function connectAndFetchData(): Promise<DataResponsePayload> {
	return new Promise((resolve) => {
		const port = chrome.runtime.connect({ name: "contest-summary-fetch" });
		let resolvedStateReady = false;

		const cleanup = () => {
			try { port.disconnect(); } catch { /* ignore */ }
		};

		port.onMessage.addListener((message: { state?: string; type?: string; payload?: DataResponsePayload }) => {
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

export function parseDivision(name: string): string {
	const m = /Div\.?\s*(\d)/i.exec(name);
	if (m) return `Div. ${m[1]}`;
	if (/Div\.?\s*1\s*\+\s*Div\.?\s*2/i.test(name)) return "Div.1+Div. 2";
	if (/Educational/i.test(name)) return "Educational";
	return "Other";
}

export function safeParseStart(startTime: string | undefined | null): number | null {
	if (!startTime) return null;
	const t = Date.parse(startTime);
	return isNaN(t) ? null : Math.floor(t / 1000);
}