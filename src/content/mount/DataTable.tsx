import ProblemDataTable from "../components/datatable/DataTable";
import { mountComponent, unmountComponent } from "../utils/ComponentUtils.tsx";
const CONTAINER_ID = "cf-mentor-datatable";

let originalContent: string | null = null;
let originalStyle: string | null = null;
let originalClassName: string | null = null;
const paginationDiv = document.querySelector(
	".pagination",
) as HTMLElement | null;

function isProblemsetPage(): boolean {
	const { pathname } = window.location;
	return pathname === "/problemset";
}

export function mountDataTable() {
	const targetDiv = document.querySelector(".datatable") as HTMLElement | null;
	const isOnProblemsetPage = isProblemsetPage();
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
		// targetDiv.removeAttribute("style");
		// targetDiv.className = "";

		// Add a container ID for unmounting and direct mounting
		targetDiv.id = CONTAINER_ID;

		// Mount directly into the target div
		mountComponent(targetDiv, <ProblemDataTable />);
	}
}

export function unmountDataTable() {
	const targetDiv = document.getElementById(CONTAINER_ID) as HTMLElement | null;
	if (targetDiv) {
		// Unmount the component
		unmountComponent(targetDiv);
		targetDiv.removeAttribute("id"); // Remove the temporary ID

		// Restore original state
		if (originalContent) {
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
