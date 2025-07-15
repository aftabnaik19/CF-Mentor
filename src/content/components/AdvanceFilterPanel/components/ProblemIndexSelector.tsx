import PropTypes from "prop-types";

import { PROBLEM_INDICES } from "../../../../data/filter-panel-data";
import { styles } from "../styles";

export const ProblemIndexSelector = ({
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
									title={problemIndex.description}
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

ProblemIndexSelector.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	selectedIndices: PropTypes.array.isRequired,
	onIndexToggle: PropTypes.func.isRequired,
	hoverState: PropTypes.object.isRequired,
	handleMouseEnter: PropTypes.func.isRequired,
	handleMouseLeave: PropTypes.func.isRequired,
};
