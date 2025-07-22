/// <reference lib="dom" />
import { MountComponent, UnmountComponent } from "../utils/ComponentUtils";

const CHAT_ROOT_ID = "cf-chat-host";
const CHAT_MOUNT_ID = "cf-chat-root";

/**
 * Mounts the Chat Panel inside a Shadow DOM.
 */
export async function mountChatPanel() {
	if (document.getElementById(CHAT_ROOT_ID)) return;

	const host = document.createElement("div");
	host.id = CHAT_ROOT_ID;
	document.body.appendChild(host);

	const shadowRoot = host.attachShadow({ mode: "open" });
	const shadowMount = document.createElement("div");
	shadowMount.id = CHAT_MOUNT_ID;
	shadowRoot.appendChild(shadowMount);

	// Dynamically import the ChatPanel component
	const { default: ChatPanel } = await import("../ChatPanel/Main");

	// Mount the React component using your existing utility
	MountComponent(shadowMount, <ChatPanel />);
}

/**
 * Unmounts and removes the Chat Panel.
 */
export function unmountChatPanel() {
	const host = document.getElementById(CHAT_ROOT_ID);
	if (host) {
		const shadowRoot = host.shadowRoot;
		if (shadowRoot) {
			const shadowMount = shadowRoot.getElementById(CHAT_MOUNT_ID);
			if (shadowMount) {
				UnmountComponent(shadowMount);
			}
		}
		host.remove();
	}
}
