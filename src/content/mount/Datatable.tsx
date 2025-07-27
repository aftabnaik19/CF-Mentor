import Datatable from "../components/Datatable";
import { MountComponent, UnmountComponent } from "../utils/ComponentUtils";
const CONTAINER_ID = "cf-mentor-datatable";

let originalContent: string | null = null;
let originalStyle: string | null = null;
let originalClassName: string | null = null;
const paginationDiv = document.querySelector(
	".pagination",
) as HTMLElement | null;

function isProblemsetPage(url: string): boolean {
	return /^https:\/\/codeforces\.com\/problemset/.test(url);
}

export function mountDatatable() {
	const targetDiv = document.querySelector(".datatable") as HTMLElement | null;
	const isOnProblemsetPage = isProblemsetPage(window.location.href);
	if (
		targetDiv &&
		isOnProblemsetPage &&
		!document.getElementById(CONTAINER_ID)
	) {
		// Store the original content, style and class
		originalContent = targetDiv.innerHTML;
		originalStyle = targetDiv.getAttribute("style");
		originalClassName = targetDiv.className;
		if (paginationDiv) paginationDiv.style.display = "none";
		// Clear its contents and styles
		targetDiv.innerHTML = "";
		targetDiv.removeAttribute("style");
		targetDiv.className = "";

		// Create host and shadow DOM
		const host = document.createElement("div");
		host.id = CONTAINER_ID;
		targetDiv.appendChild(host);
		const shadowRoot = host.attachShadow({ mode: "open" });
		const shadowMount = document.createElement("div");
		shadowRoot.appendChild(shadowMount);

		// Mount into shadow root
		MountComponent(shadowMount, <Datatable />);
	}
}

export function unmountDatatable() {
	const host = document.getElementById(CONTAINER_ID) as HTMLElement | null;
	if (host) {
		const targetDiv = host.parentElement as HTMLElement | null;
		if (host.shadowRoot) {
			const shadowMount = host.shadowRoot
				.firstElementChild as HTMLElement | null;
			if (shadowMount) {
				UnmountComponent(shadowMount);
			}
		}
		host.remove();

		if (targetDiv && originalContent) {
			targetDiv.innerHTML = originalContent;
			if (originalStyle) {
				targetDiv.setAttribute("style", originalStyle);
			}
			if (originalClassName) {
				targetDiv.className = originalClassName;
			}
			originalContent = null;
			originalStyle = null;
			originalClassName = null;
		}
	}
	if (paginationDiv) {
		paginationDiv.style.display = "block";
	}
}

