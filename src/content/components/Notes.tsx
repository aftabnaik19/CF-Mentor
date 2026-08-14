import React from "react";

interface NotesProps {
	value: string;
	onChange: (value: string) => void;
}

const Notes: React.FC<NotesProps> = ({ value, onChange }) => {
	return (
		<div style={{ marginTop: "1em" }}>
			<label htmlFor="userNotes" style={{ fontWeight: "bold" }}>
				Your Notes
			</label>
			<textarea
				id="userNotes"
				placeholder="Write something..."
				value={value}
				onChange={(e) => onChange((e.target as HTMLTextAreaElement).value)}
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
