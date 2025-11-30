import AdvanceFilterPanel from "../components/AdvanceFilterPanel";
import { SettingsPanel } from "../components/SettingsPanel";
import { mountComponent, unmountComponent } from "../utils/ComponentUtils.tsx";
const CONTAINER_ID = "cf-mentor-advance-filters-panel-host";
const SETTINGS_SIDEBOX_SELECTOR = "#change-hide-tag-status";

let originalContent: string | null = null;
let settingsSidebox: HTMLElement | null = null;
let originalSettingsContent: string | null = null;

function isProblemsetPage(): boolean {
	const path = window.location.pathname;
	return path === "/problemset" || path === "/problemset/";
}

export function mountAdvanceFilterPanel() {
	const targetDiv = document.querySelector(
		".roundbox.sidebox._FilterByTagsFrame_main.borderTopRound",
	) as HTMLElement | null;

	const isOnProblemsetPage = isProblemsetPage();
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

		// Mount Settings Panel
		const settingsInput = document.querySelector(SETTINGS_SIDEBOX_SELECTOR);
		if (settingsInput) {
			const sidebox = settingsInput.closest(".roundbox.sidebox") as HTMLElement;
			if (sidebox) {
				settingsSidebox = sidebox;
				originalSettingsContent = sidebox.innerHTML;
				sidebox.innerHTML = ""; // Clear original content
				mountComponent(sidebox, <SettingsPanel />);
			}
		}
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

		// Restore Settings Panel
		if (settingsSidebox && originalSettingsContent) {
			unmountComponent(settingsSidebox);
			settingsSidebox.innerHTML = originalSettingsContent;
			settingsSidebox = null;
			originalSettingsContent = null;
		}
	}
}
