import PropTypes from "prop-types";

import { styles } from "../styles";

export const DropdownSelector = ({
	isOpen,
	setIsOpen,
	title,
	selectedItems,
	items,
	onItemToggle,
	hoverState,
	handleMouseEnter,
	handleMouseLeave,
}) => {
	return (
		<div style={styles.spaceY2}>
			<label style={styles.label}>{title}</label>
			<div style={styles.dropdown}>
				<button
					onClick={() => setIsOpen(!isOpen)}
					style={{
						...styles.btn,
						width: "100%",
						justifyContent: "space-between",
						...(hoverState[`${title}Btn`] && styles.btnHover),
					}}
					onMouseEnter={() => handleMouseEnter(`${title}Btn`)}
					onMouseLeave={() => handleMouseLeave(`${title}Btn`)}
				>
					<span>
						{selectedItems.length > 0
							? `${selectedItems.length} item${
									selectedItems.length > 1 ? "s" : ""
							  } selected`
							: `Select ${title.toLowerCase()}`}
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
					<div style={styles.dropdownContent}>
						{items.map((item) => (
							<div
								key={item.value}
								onClick={() => onItemToggle(item.value)}
								style={{
									...styles.checkboxItem,
									...(hoverState[`${title}-${item.value}`] &&
										styles.checkboxItemHover),
								}}
								onMouseEnter={() =>
									handleMouseEnter(`${title}-${item.value}`)
								}
								onMouseLeave={() =>
									handleMouseLeave(`${title}-${item.value}`)
								}
							>
								<input
									type="checkbox"
									id={item.value}
									style={styles.checkbox}
									checked={selectedItems.includes(item.value)}
									readOnly
								/>
								<div>
									<label
										htmlFor={item.value}
										style={{ fontWeight: "500", cursor: "pointer" }}
									>
										{item.label}
									</label>
									<p
										style={{
											fontSize: "0.85rem",
											color: "#6b7280",
											margin: 0,
										}}
									>
										{item.description}
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

DropdownSelector.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	title: PropTypes.string.isRequired,
	selectedItems: PropTypes.array.isRequired,
	items: PropTypes.array.isRequired,
	onItemToggle: PropTypes.func.isRequired,
	hoverState: PropTypes.object.isRequired,
	handleMouseEnter: PropTypes.func.isRequired,
	handleMouseLeave: PropTypes.func.isRequired,
};
