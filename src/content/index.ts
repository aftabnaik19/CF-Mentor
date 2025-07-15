import { mountAdvanceFilterPanel } from "./mount/AdvanceFilterPanel";
import { mountProblemAssistant } from "./mount/ProblemAssistant";
// Wrap in async function to handle await
async function initializeComponents() {
	mountProblemAssistant();
	mountAdvanceFilterPanel();
	// await mountChatPanel();
}

// Call the async function
initializeComponents().catch(console.error);

// let isMounted = false;
// setInterval(() => {
// 	if (isMounted) {
// 		unmountAdvanceFilterPanel();
// 	} else {
// 		mountAdvanceFilterPanel();
// 	}
// 	isMounted = !isMounted;
// }, 5000);
