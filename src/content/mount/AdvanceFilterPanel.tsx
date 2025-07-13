import AdvanceFilterPanel from "../components/AdvanceFilterPanel";
import { MountComponent, UnmountComponent } from "../utils/ComponentUtils";
const CONTAINER_ID = "cf-mentor-advance-filters-panel";

function isProblemsetPage(url: string): boolean {
	return (
		url === "https://codeforces.com/problemset" ||
		url === "https://codeforces.com/problemset/#" ||
		/^https:\/\/codeforces\.com\/problemset\?/.test(url) ||
		/^https:\/\/codeforces\.com\/problemset\/page\/[\d]+/.test(url)
	);
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
		// Clear its contents and styles
		targetDiv.innerHTML = "";
		targetDiv.removeAttribute("style");

		// Create host and shadow DOM
		const host = document.createElement("div");
		host.id = CONTAINER_ID;
		const shadowRoot = host.attachShadow({ mode: "open" });
		targetDiv.appendChild(host);

		// Mount into shadow root
		const shadowMount = document.createElement("div");
		shadowRoot.appendChild(shadowMount);
		MountComponent(shadowMount, <AdvanceFilterPanel />);
	}
}

export function unmountAdvanceFilterPanel() {
	const container = document.getElementById(CONTAINER_ID);
	if (container) {
		const shadowRoot = container.shadowRoot;
		if (shadowRoot) {
			const shadowMount = shadowRoot.firstElementChild as HTMLElement | null;
			if (shadowMount) {
				UnmountComponent(shadowMount);
			}
		}
		container.remove();
	}
}
