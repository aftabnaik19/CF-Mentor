import React, { useState } from "react";

interface DifficultySelectorProps {
	difficulty: number;
	onChange: (value: number) => void;
	onReset: () => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
	difficulty,
	onChange,
	onReset,
}) => {
	const [hovered, setHovered] = useState<number | null>(null);

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				width: "100%",
				padding: "1em 0",
			}}
		>
			{/* Left: Label + Stars */}
			<div style={{ display: "flex", alignItems: "center", gap: "0.8em" }}>
				<label style={{ fontWeight: "bold" }}>Difficulty:</label>
				<ul
					style={{
						display: "flex",
						gap: "0.4em",
						listStyle: "none",
						margin: 0,
						padding: 0,
					}}
				>
					{[1, 2, 3, 4, 5].map((val) => {
						const isHighlighted =
							hovered !== null ? val <= hovered : val <= difficulty;

						return (
							<li key={val}>
								<span
									onClick={() => onChange(val)}
									onMouseEnter={() => setHovered(val)}
									onMouseLeave={() => setHovered(null)}
									aria-label={`Vote difficulty ${val}`}
									style={{
										cursor: "pointer",
										display: "inline-block",
										transition: "transform 0.2s ease",
										transform: isHighlighted ? "scale(1.2)" : "scale(1)",
									}}
								>
									<img
										src={`//codeforces.org/s/46398/images/icons/star_${
											isHighlighted ? "yellow" : "gray"
										}_24.png`}
										alt={`Difficulty star ${val}`}
										style={{ height: "1em" }}
									/>
								</span>
							</li>
						);
					})}
				</ul>
			</div>

			{/* Right: div1 with Reset centered */}
			<div
				style={{
					flex: 1,
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<span
					onClick={onReset}
					style={{
						color: "#007bff",
						fontSize: "1.1rem",
						textDecoration: "underline",
						cursor: "pointer",
					}}
				>
					Reset
				</span>
			</div>
		</div>
	);
};

export default DifficultySelector;
