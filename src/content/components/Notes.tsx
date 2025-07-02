import { useState } from "react";

const Notes: React.FC = () => {
	const [note, setNote] = useState("");

	return (
		<div style={{ marginTop: "1em" }}>
			<label htmlFor="userNotes" style={{ fontWeight: "bold" }}>
				Your Notes
			</label>
			<textarea
				id="userNotes"
				placeholder="Write something..."
				value={note}
				onChange={(e) => setNote(e.target.value)}
				style={{
					width: "100%",
					height: "60px",
					marginTop: "0.5em",
					resize: "vertical",
					boxSizing: "border-box",
				}}
			/>
		</div>
	);
};

export default Notes;
