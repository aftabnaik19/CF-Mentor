import "./PopupApp.css";

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
		<div className="popup-container">
			<h1>CF Mentor Controls</h1>
			<p>Use this button to manually fetch and store the problem data.</p>
			<button onClick={handleFetchClick}>Fetch and Log Data</button>
		</div>
	);
};

export default Popup;