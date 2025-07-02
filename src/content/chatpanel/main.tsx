import { createRoot } from "react-dom/client";

import App from "./App";

const container = document.getElementById("cf-chat-root");
if (container) {
	const root = createRoot(container);
	root.render(<App />);
}

export function mountChatPanel(
	container: HTMLElement,
	_shadowRoot?: ShadowRoot,
) {
	const root = createRoot(container);
	root.render(<App />);
}
