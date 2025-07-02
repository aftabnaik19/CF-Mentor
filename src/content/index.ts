const sidebar = document.getElementById("sidebar");
// ✅ Inject Stopwatch + Bookmarks Panel (contentApp)
if (sidebar) {
	const container = document.createElement("div");
	container.id = "cf-mentor-container";
	sidebar.prepend(container);

	const root = document.createElement("div");
	container.appendChild(root);

	import("./contentApp").then(({ mountApp }) => {
		mountApp(root);
	});
}

// ✅ Inject Chat Panel (React App inside Shadow DOM)
const chatRootId = "cf-chat-host";

if (!document.getElementById(chatRootId)) {
	const host = document.createElement("div");
	host.id = chatRootId;
	document.body.appendChild(host);

	const shadowRoot = host.attachShadow({ mode: "open" });

	// Create a mount point inside the shadow root
	const shadowMount = document.createElement("div");
	shadowMount.id = "cf-chat-root";
	shadowRoot.appendChild(shadowMount);

	// Now load React and mount into that shadow root
	import("./chatpanel/main").then(({ mountChatPanel }) => {
		mountChatPanel(shadowMount, shadowRoot); // 👈 pass shadowRoot if needed for style scoping
	});
}
