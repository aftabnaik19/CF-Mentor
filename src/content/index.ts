import "primereact/resources/primereact.min.css"; // core styles
import "primeicons/primeicons.css";

import { mountAdvanceFilterPanel } from "./mount/AdvanceFilterPanel";
import { mountDatatable } from "./mount/Datatable";
import { mountProblemAssistant } from "./mount/ProblemAssistant";
// Wrap in async function to handle await
async function initializeComponents() {
	mountProblemAssistant();
	mountAdvanceFilterPanel();
	mountDatatable();
	// await mountChatPanel();
}

// Call the async function
initializeComponents().catch(console.error);

// let isMounted = false;
// setInterval(() => {
// 	if (isMounted) {
// 		unmountDatatable();
// 	} else {
// 		mountDatatable();
// 	}
// 	isMounted = !isMounted;
// }, 5000);
