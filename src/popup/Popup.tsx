// src/popup/Popup.tsx or Popup.jsx
export default function Popup() {
	const openSidePanel = async () => {
		try {
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});

			await chrome.sidePanel.setOptions({
				tabId: tab.id,
				enabled: true,
				path: "src/sidepanel/index.html", // optional if already in manifest
			});

			await chrome.sidePanel.open({ tabId: tab.id });

			console.log("✅ Side panel open requested for tab:", tab.id);
		} catch (err) {
			console.error(
				"❌ Failed to open side panel:",
				chrome.runtime.lastError || err,
			);
		}
	};

	return (
		<div>
			<h1>Hello from Popup</h1>
			<button type="button" onClick={openSidePanel}>
				Open Side Panel
			</button>
		</div>
	);
}
