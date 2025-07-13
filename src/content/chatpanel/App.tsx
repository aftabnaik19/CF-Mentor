export default function ChatPanel() {
	return (
		<div
			style={{
				position: "fixed",
				bottom: "1rem",
				right: "1rem",
				backgroundColor: "white",
				border: "1px solid #ccc",
				borderRadius: "8px",
				padding: "1rem",
				boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
				zIndex: 9999,
			}}
		>
			<h3 style={{ margin: 0 }}>🧠 CF Mentor Chat</h3>
			<p style={{ fontSize: "0.9rem" }}>
				How can I help you solve this problem?
			</p>
			<textarea
				rows={3}
				style={{
					width: "100%",
					marginTop: "0.5rem",
					borderRadius: "4px",
					resize: "vertical",
				}}
				placeholder="Ask a question..."
			/>
			<button
				type="button"
				style={{
					marginTop: "0.5rem",
					padding: "0.5rem 1rem",
					borderRadius: "4px",
					border: "none",
					background: "#007bff",
					color: "#fff",
					cursor: "pointer",
				}}
			>
				Send
			</button>
		</div>
	);
}
