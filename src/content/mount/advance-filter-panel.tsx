import AdvanceFilterPanel from "../components/advance-filter-panel";
import { mountComponent, unmountComponent } from "../utils/componentUtils.tsx";
const CONTAINER_ID = "cf-mentor-advance-filters-panel-host";

let originalContent: string | null = null;

function isProblemsetPage(url: string): boolean {
	return /^https:\/\/codeforces\.com\/problemset/.test(url);
}

export function mountAdvanceFilterPanel() {
	const targetDiv = document.querySelector(
		".roundbox.sidebox._FilterByTagsFrame_main.borderTopRound",
	) as HTMLElement | null;

	const isOnProblemsetPage = isProblemsetPage(window.location.href);
	if (
		targetDiv &&
		isOnProblemsetPage &&
		!document.getElementById(CONTAINER_ID)
	) {
		// Store the original content
		originalContent = targetDiv.innerHTML;

		// Clear its contents and styles
		targetDiv.innerHTML = "";
		targetDiv.removeAttribute("style");

		// Create host and shadow DOM
		const host = document.createElement("div");
		host.id = CONTAINER_ID;
		targetDiv.appendChild(host);
		const shadowRoot = host.attachShadow({ mode: "open" });
		const shadowMount = document.createElement("div");
		shadowRoot.appendChild(shadowMount);

		// Mount into shadow root
		mountComponent(shadowMount, <AdvanceFilterPanel />);
	}
}

export function unmountAdvanceFilterPanel() {
	const host = document.getElementById(CONTAINER_ID) as HTMLElement | null;
	if (host) {
		const targetDiv = host.parentElement as HTMLElement | null;
		if (host.shadowRoot) {
			const shadowMount = host.shadowRoot
				.firstElementChild as HTMLElement | null;
			if (shadowMount) {
				unmountComponent(shadowMount);
			}
		}
		host.remove();

		if (targetDiv && originalContent) {
			targetDiv.innerHTML = originalContent;
			originalContent = null;
		}
	}
}
