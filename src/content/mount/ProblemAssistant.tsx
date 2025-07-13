import ProblemAssistantPanel from "../components/ProblemAssistantPanel";
import { MountComponent, UnmountComponent } from "../utils/ComponentUtils";

const CONTAINER_ID = "cf-mentor-problem-assistance-panel";

export function mountProblemAssistant() {
	const sidebar = document.getElementById("sidebar");
	const isProblemPage =
		/^https:\/\/codeforces\.com\/(?:contest\/\d+\/problem|problemset\/problem\/\d+)\/[A-Z]\w*/.test(
			window.location.href,
		);
	if (sidebar && isProblemPage && !document.getElementById(CONTAINER_ID)) {
		const container = document.createElement("div");
		container.id = CONTAINER_ID;
		sidebar.prepend(container);
		MountComponent(container, <ProblemAssistantPanel />);
	}
}

export function unmountProblemAssistant() {
	const container = document.getElementById(CONTAINER_ID);
	if (container) {
		UnmountComponent(container);
		container.remove();
	}
}
