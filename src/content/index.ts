import { mountAdvanceFilterPanel } from "./mount/AdvanceFilterPanel";
import { mountChatPanel, unmountChatPanel } from "./mount/chatPanel";
import {
	mountProblemAssistant,
	unmountProblemAssistant,
} from "./mount/ProblemAssistant";
// Wrap in async function to handle await
async function initializeComponents() {
	mountProblemAssistant();
	mountAdvanceFilterPanel();
	// await mountChatPanel();
}

// Call the async function
initializeComponents().catch(console.error);
