import "primereact/resources/primereact.min.css"; // core styles
import "primeicons/primeicons.css";

import { mountAdvanceFilterPanel } from "./mount/advance-filter-panel";
import { mountDatatable } from "./mount/Datatable";
import { mountProblemAssistant } from "./mount/problem-assistant";
import { useFilterStore } from "../shared/stores/filter-store";

// Wrap in async function to handle await
async function initializeComponents() {
	mountProblemAssistant();
	mountAdvanceFilterPanel();
	mountDatatable();
	// await mountChatPanel();
}

// Call the async function
initializeComponents().catch(console.error);

// --- DEBUG ---
// Expose the setFilters function to the window object for easy debugging from the console.
// This should be removed in production builds.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).setAppFilters = useFilterStore.getState().setFilters;
// --- END DEBUG ---

// let isMounted = false;
// setInterval(() => {
// 	if (isMounted) {
// 		unmountDatatable();
// 	} else {
// 		mountDatatable();
// 	}
// 	isMounted = !isMounted;
// }, 5000);
