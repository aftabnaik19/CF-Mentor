import "./ChatApp.css";

export default function ChatPanel() {
	return (
		<div className="chat-panel">
			<h3>🧠 CF Mentor Chat</h3>
			<p>How can I help you solve this problem?</p>
			<textarea rows={3} placeholder="Ask a question..." />
			<button type="button">Send</button>
		</div>
	);
}
