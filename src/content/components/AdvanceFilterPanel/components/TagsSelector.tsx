import PropTypes from "prop-types";

import { styles } from "../styles";

export const TagsSelector = ({
	filteredTags,
	selectedTags,
	onTagToggle,
	hoverState,
	handleMouseEnter,
	handleMouseLeave,
	getTagGridStyle,
}) => {
	return (
		<div style={styles.scrollArea}>
			<div style={getTagGridStyle()}>
				{filteredTags.map((tag) => (
					<div
						key={tag.value}
						onClick={() => onTagToggle(tag.value)}
						style={{
							...styles.tagGridItem,
							...(selectedTags.includes(tag.value) &&
								styles.tagGridItemSelected),
							...(hoverState[`tag-${tag.value}`] &&
								!selectedTags.includes(tag.value) &&
								styles.tagGridItemHover),
						}}
						onMouseEnter={() => handleMouseEnter(`tag-${tag.value}`)}
						onMouseLeave={() => handleMouseLeave(`tag-${tag.value}`)}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
							}}
						>
							<input
								type="checkbox"
								style={styles.checkbox}
								checked={selectedTags.includes(tag.value)}
								readOnly
							/>
							<div>
								<div style={{ fontSize: "0.95rem", fontWeight: "500" }}>
									{tag.label}
								</div>
								<div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
									{tag.description}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

TagsSelector.propTypes = {
	filteredTags: PropTypes.array.isRequired,
	selectedTags: PropTypes.array.isRequired,
	onTagToggle: PropTypes.func.isRequired,
	hoverState: PropTypes.object.isRequired,
	handleMouseEnter: PropTypes.func.isRequired,
	handleMouseLeave: PropTypes.func.isRequired,
	getTagGridStyle: PropTypes.func.isRequired,
};
