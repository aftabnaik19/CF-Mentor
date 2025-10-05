const Popup = () => {
	const handleFetchClick = () => {
		chrome.runtime.sendMessage({ action: "fetchData" }, (response) => {
			if (chrome.runtime.lastError) {
				console.error(
					"Error sending message:",
					chrome.runtime.lastError.message,
				);
			} else {
				console.log(response.status);
			}
		});
	};

	return (
		<div>
			<h1>CF Mentor Controls</h1>
			<p>Use this button to manually fetch and store the problem data.</p>
			<button
				onClick={handleFetchClick}
				style={{
					padding: "8px 16px",
					backgroundColor: "#3B5998",
					color: "white",
					border: "none",
					borderRadius: "4px",
					cursor: "pointer",
					fontSize: "14px",
					fontWeight: "500",
				}}
			>
				Fetch and Log Data
			</button>
		</div>
	);
};

export default Popup;