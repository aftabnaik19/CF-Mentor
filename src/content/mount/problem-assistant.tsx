/// <reference lib="dom" />
import ProblemAssistantPanel from "../components/ProblemAssistantPanel";
import { mountComponent, unmountComponent } from "../utils/componentUtils.tsx";

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
		mountComponent(container, <ProblemAssistantPanel />);
	}
}

export function unmountProblemAssistant() {
	const container = document.getElementById(CONTAINER_ID);
	if (container) {
		unmountComponent(container);
		container.remove();
	}
}
