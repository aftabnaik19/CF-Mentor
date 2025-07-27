import React from "react";

import { PROBLEM_INDICES } from "@/shared/data/filter-panel-data";

import { styles } from "../styles";

interface ProblemIndexSelectorProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedIndices: string[];
  onIndexToggle: (value: string) => void;
  hoverState: Record<string, boolean>;
  handleMouseEnter: (key: string) => void;
  handleMouseLeave: (key: string) => void;
}

export const ProblemIndexSelector: React.FC<ProblemIndexSelectorProps> = ({
	isOpen,
	setIsOpen,
	selectedIndices,
	onIndexToggle,
	hoverState,
	handleMouseEnter,
	handleMouseLeave,
}) => {
	return (
		<div style={styles.spaceY2}>
			<label style={styles.label}>Problem Index</label>
			<div style={styles.dropdown}>
				<button
					onClick={() => setIsOpen(!isOpen)}
					style={{
						...styles.btn,
						width: "100%",
						justifyContent: "space-between",
						...(hoverState.problemIndexBtn && styles.btnHover),
					}}
					onMouseEnter={() => handleMouseEnter("problemIndexBtn")}
					onMouseLeave={() => handleMouseLeave("problemIndexBtn")}
				>
					<span>
						{selectedIndices.length > 0
							? selectedIndices.sort().join(", ")
							: "Select indices"}
					</span>
					<svg
						style={{
							...styles.icon,
							width: "1rem",
							height: "1rem",
							transition: "transform 0.2s",
							transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
						}}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
					>
						<polyline points="6,9 12,15 18,9" />
					</svg>
				</button>
				{isOpen && (
					<div style={{ ...styles.dropdownContent, padding: "1rem" }}>
						<div style={styles.problemIndexGrid}>
							{PROBLEM_INDICES.map((problemIndex) => (
								<div
									key={problemIndex.value}
									onClick={() => onIndexToggle(problemIndex.value)}
									style={{
										...styles.problemIndexItem,
										...(selectedIndices.includes(problemIndex.value) &&
											styles.problemIndexItemSelected),
										...(hoverState[`index-${problemIndex.value}`] &&
											!selectedIndices.includes(problemIndex.value) &&
											styles.problemIndexItemHover),
									}}
									onMouseEnter={() =>
										handleMouseEnter(`index-${problemIndex.value}`)
									}
									onMouseLeave={() =>
										handleMouseLeave(`index-${problemIndex.value}`)
									}
								>
									<div style={{ fontWeight: "600", fontSize: "1.1rem" }}>
										{problemIndex.label}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
