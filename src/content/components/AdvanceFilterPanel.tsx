import { useEffect, useState } from "react";

import {
	ALGORITHM_TAGS,
	CONTEST_TYPES,
	PROBLEM_INDICES,
	PROBLEM_SHEETS,
} from "../../data/filter-panel-data.ts";

export default function ProblemFilter() {
	const [minDifficulty, setMinDifficulty] = useState("");
	const [maxDifficulty, setMaxDifficulty] = useState("");
	const [selectedTags, setSelectedTags] = useState([]);
	const [selectedSheets, setSelectedSheets] = useState([]);
	const [combineMode, setCombineMode] = useState("and");
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const [tagSearchQuery, setTagSearchQuery] = useState("");
	const [selectedContestTypes, setSelectedContestTypes] = useState([]);
	const [selectedProblemIndices, setSelectedProblemIndices] = useState([]);
	const [showContestTypeDropdown, setShowContestTypeDropdown] = useState(false);
	const [showProblemIndexDropdown, setShowProblemIndexDropdown] =
		useState(false);
	const [showSheetsDropdown, setShowSheetsDropdown] = useState(false);

	// State for managing hover and focus effects for inline styling
	const [hoverState, setHoverState] = useState({});
	const [focusState, setFocusState] = useState({});

	// State for managing window width for responsive inline styles
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	// Effect to listen for window resize to apply responsive styles
	useEffect(() => {
		const handleResize = () => setWindowWidth(window.innerWidth);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Handlers to toggle hover and focus states
	const handleMouseEnter = (key) =>
		setHoverState((prev) => ({ ...prev, [key]: true }));
	const handleMouseLeave = (key) =>
		setHoverState((prev) => ({ ...prev, [key]: false }));
	const handleFocus = (key) =>
		setFocusState((prev) => ({ ...prev, [key]: true }));
	const handleBlur = (key) =>
		setFocusState((prev) => ({ ...prev, [key]: false }));

	const filteredTags = ALGORITHM_TAGS.filter(
		(tag) =>
			tag.label.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
			tag.description.toLowerCase().includes(tagSearchQuery.toLowerCase()),
	);

	const handleTagToggle = (tagValue) => {
		setSelectedTags((prev) =>
			prev.includes(tagValue)
				? prev.filter((t) => t !== tagValue)
				: [...prev, tagValue],
		);
	};

	const handleSheetToggle = (sheetValue) => {
		setSelectedSheets((prev) =>
			prev.includes(sheetValue)
				? prev.filter((s) => s !== sheetValue)
				: [...prev, sheetValue],
		);
	};

	const handleContestTypeToggle = (contestType) => {
		setSelectedContestTypes((prev) =>
			prev.includes(contestType)
				? prev.filter((c) => c !== contestType)
				: [...prev, contestType],
		);
	};

	const handleProblemIndexToggle = (problemIndex) => {
		setSelectedProblemIndices((prev) =>
			prev.includes(problemIndex)
				? prev.filter((p) => p !== problemIndex)
				: [...prev, problemIndex],
		);
	};

	const removeTag = (tagValue) => {
		setSelectedTags((prev) => prev.filter((t) => t !== tagValue));
	};

	const clearAllFilters = () => {
		setMinDifficulty("");
		setMaxDifficulty("");
		setSelectedTags([]);
		setSelectedSheets([]);
		setSelectedContestTypes([]);
		setSelectedProblemIndices([]);
		setCombineMode("and");
	};

	const handleAutoRecommend = () => {
		console.log("Auto recommend triggered");
	};

	const handleApplyFilters = () => {
		const filters = {
			minDifficulty,
			maxDifficulty,
			selectedTags,
			selectedSheets,
			selectedContestTypes,
			selectedProblemIndices,
			combineMode,
		};
		console.log("Applying filters:", filters);
	};

	// Centralized style object for all inline styles
	const styles = {
		card: {
			borderWidth: "2px",
			borderStyle: "solid",
			borderColor: "#bfdbfe",
			borderRadius: "8px",
			boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
			background: "white",
			fontFamily: "Inter, sans-serif",
		},
		cardHeader: {
			background: "linear-gradient(to right, #eff6ff, #eef2ff)",
			borderBottom: "1px solid #e5e7eb",
			padding: "1.5rem",
		},
		cardTitle: {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			color: "#1e3a8a",
			fontSize: "1.35rem",
			fontWeight: 600,
			margin: 0,
		},
		cardContent: {
			padding: "1.5rem",
			display: "flex",
			flexDirection: "column",
			gap: "1.5rem",
		},
		btn: {
			padding: "0.5rem 1rem",
			borderRadius: "6px",
			borderWidth: "1px",
			borderStyle: "solid",
			borderColor: "#d1d5db",
			background: "white",
			cursor: "pointer",
			fontSize: "0.95rem",
			fontWeight: 500,
			transition: "all 0.2s",
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			gap: "0.5rem",
			color: "#374151",
			textDecoration: "none",
		},
		btnHover: { background: "#f9fafb" },
		btnPrimary: {
			background: "#2563eb",
			color: "white",
			borderColor: "#2563eb",
		},
		btnPrimaryHover: { background: "#1d4ed8" },
		btnGradient: {
			background: "linear-gradient(to right, #a855f7, #ec4899)",
			color: "white",
			borderStyle: "none",
		},
		btnGradientHover: {
			background: "linear-gradient(to right, #9333ea, #db2777)",
		},
		btnOutline: { background: "transparent", color: "#6b7280" },
		btnOutlineHover: { color: "#374151", background: "#f3f4f6" },
		btnGhost: {
			background: "transparent",
			borderStyle: "none",
			color: "#374151",
		},
		btnGhostHover: { background: "#f3f4f6" },
		btnSm: { padding: "0.25rem 0.75rem", fontSize: "0.85rem" },
		btnLg: { padding: "0.75rem 1.5rem", fontSize: "1.1rem" },
		input: {
			padding: "0.5rem 0.75rem",
			borderWidth: "1px",
			borderStyle: "solid",
			borderColor: "#d1d5db",
			borderRadius: "6px",
			fontSize: "0.95rem",
			width: "100%",
			boxSizing: "border-box",
			transition: "all 0.2s",
		},
		inputFocus: {
			outline: "none",
			borderColor: "#3b82f6",
			boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
		},
		label: {
			fontSize: "0.95rem",
			fontWeight: 500,
			color: "#374151",
			marginBottom: "0.5rem",
			display: "block",
		},
		spaceY2: { display: "flex", flexDirection: "column", gap: "0.5rem" },
		badge: {
			display: "inline-flex",
			alignItems: "center",
			padding: "0.25rem 0.75rem",
			borderRadius: "9999px",
			fontSize: "0.85rem",
			fontWeight: 500,
			background: "#dbeafe",
			color: "#1e40af",
			gap: "0.25rem",
		},
		dropdown: { position: "relative", width: "100%" },
		dropdownContent: {
			position: "absolute",
			top: "calc(100% + 4px)",
			left: 0,
			right: 0,
			background: "white",
			borderWidth: "1px",
			borderStyle: "solid",
			borderColor: "#d1d5db",
			borderRadius: "6px",
			boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
			zIndex: 10,
			maxHeight: "16rem",
			overflowY: "auto",
			padding: "0.5rem",
			boxSizing: "border-box",
		},
		checkboxItem: {
			display: "flex",
			alignItems: "flex-start",
			gap: "0.75rem",
			padding: "0.5rem",
			borderRadius: "4px",
			cursor: "pointer",
		},
		checkboxItemHover: { backgroundColor: "#f3f4f6" },
		checkbox: {
			width: "1rem",
			height: "1rem",
			marginTop: "0.2rem",
			flexShrink: 0,
		},
		tagGridItem: {
			padding: "0.5rem",
			borderRadius: "6px",
			borderWidth: "1px",
			borderStyle: "solid",
			borderColor: "#d1d5db",
			cursor: "pointer",
			transition: "all 0.2s",
			background: "white",
		},
		tagGridItemHover: { borderColor: "#9ca3af" },
		tagGridItemSelected: {
			background: "#dbeafe",
			borderColor: "#93c5fd",
			color: "#1e40af",
		},
		problemIndexGrid: {
			display: "grid",
			gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
			gap: "0.5rem",
		},
		problemIndexItem: {
			padding: "0.5rem",
			borderRadius: "6px",
			borderWidth: "1px",
			borderStyle: "solid",
			borderColor: "#d1d5db",
			cursor: "pointer",
			transition: "all 0.2s",
			textAlign: "center",
			background: "white",
		},
		problemIndexItemHover: { borderColor: "#9ca3af" },
		problemIndexItemSelected: {
			background: "#dbeafe",
			borderColor: "#93c5fd",
			color: "#1e40af",
		},
		separator: { height: "1px", background: "#e5e7eb", margin: "1rem 0" },
		filterSummary: {
			fontSize: "0.85rem",
			color: "#6b7280",
			background: "#f9fafb",
			padding: "0.75rem",
			borderRadius: "6px",
			wordBreak: "break-word",
		},
		scrollArea: {
			maxHeight: "16rem",
			overflowY: "auto",
			padding: "0.5rem",
			borderWidth: "1px",
			borderStyle: "solid",
			borderColor: "#d1d5db",
			borderRadius: "6px",
			background: "#f9fafb",
		},
		icon: {
			width: "1.25rem",
			height: "1.25rem",
			strokeWidth: 2,
			flexShrink: 0,
		},
		iconSm: { width: "0.75rem", height: "0.75rem" },
		borderT: {
			borderTop: "1px solid #e5e7eb",
			paddingTop: "1.5rem",
			marginTop: "1.5rem",
		},
		radioGroup: {
			display: "flex",
			gap: "1rem",
			alignItems: "center",
			height: "100%",
		},
		radioItem: {
			display: "flex",
			alignItems: "center",
			gap: "0.5rem",
			cursor: "pointer",
		},
		radio: { width: "1rem", height: "1rem" },
	};

	// Functions to generate responsive styles based on window width
	const getQuickFiltersGridStyle = () => {
		let gridTemplateColumns = "repeat(1, 1fr)";
		if (windowWidth >= 768) {
			gridTemplateColumns = "repeat(auto-fit, minmax(200px, 1fr))";
		}
		return { display: "grid", gap: "1rem", gridTemplateColumns };
	};

	const getTagGridStyle = () => {
		let gridTemplateColumns = "repeat(1, 1fr)";
		if (windowWidth >= 1024) gridTemplateColumns = "repeat(3, 1fr)";
		else if (windowWidth >= 768) gridTemplateColumns = "repeat(2, 1fr)";
		return { display: "grid", gap: "0.5rem", gridTemplateColumns };
	};

	return (
		<div style={{ maxWidth: "1024px", margin: "0 auto", width: "100%" }}>
			<div style={styles.card}>
				<div style={styles.cardHeader}>
					<h2 style={styles.cardTitle}>
						<div
							style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
						>
							<svg
								style={styles.icon}
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
							>
								<polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
							</svg>
							Filter Problems
						</div>
						<div style={{ display: "flex", gap: "0.5rem" }}>
							<button
								onClick={clearAllFilters}
								style={{
									...styles.btn,
									...styles.btnSm,
									...styles.btnOutline,
									...(hoverState["clear-all"] && styles.btnOutlineHover),
								}}
								onMouseEnter={() => handleMouseEnter("clear-all")}
								onMouseLeave={() => handleMouseLeave("clear-all")}
							>
								Clear All
							</button>
						</div>
					</h2>
				</div>

				<div style={styles.cardContent}>
					<div style={getQuickFiltersGridStyle()}>
						<div style={styles.spaceY2}>
							<label style={styles.label}>Difficulty Range</label>
							<div
								style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
							>
								<input
									type="number"
									placeholder="Min"
									value={minDifficulty}
									onChange={(e) => setMinDifficulty(e.target.value)}
									style={{
										...styles.input,
										width: "6rem",
										textAlign: "center",
										...(focusState.minDiff && styles.inputFocus),
									}}
									min="800"
									max="3500"
									onFocus={() => handleFocus("minDiff")}
									onBlur={() => handleBlur("minDiff")}
								/>
								<span style={{ color: "#9ca3af" }}>—</span>
								<input
									type="number"
									placeholder="Max"
									value={maxDifficulty}
									onChange={(e) => setMaxDifficulty(e.target.value)}
									style={{
										...styles.input,
										width: "6rem",
										textAlign: "center",
										...(focusState.maxDiff && styles.inputFocus),
									}}
									min="800"
									max="3500"
									onFocus={() => handleFocus("maxDiff")}
									onBlur={() => handleBlur("maxDiff")}
								/>
							</div>
						</div>

						<div style={styles.spaceY2}>
							<label style={styles.label}>Contest Type</label>
							<div style={styles.dropdown}>
								<button
									onClick={() =>
										setShowContestTypeDropdown(!showContestTypeDropdown)
									}
									style={{
										...styles.btn,
										width: "100%",
										justifyContent: "space-between",
										...(hoverState.contestTypeBtn && styles.btnHover),
									}}
									onMouseEnter={() => handleMouseEnter("contestTypeBtn")}
									onMouseLeave={() => handleMouseLeave("contestTypeBtn")}
								>
									<span>
										{selectedContestTypes.length > 0
											? `${selectedContestTypes.length} type${selectedContestTypes.length > 1 ? "s" : ""} selected`
											: "Select types"}
									</span>
									<svg
										style={{
											...styles.icon,
											width: "1rem",
											height: "1rem",
											transition: "transform 0.2s",
											transform: showContestTypeDropdown
												? "rotate(180deg)"
												: "rotate(0deg)",
										}}
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
									>
										<polyline points="6,9 12,15 18,9" />
									</svg>
								</button>
								{showContestTypeDropdown && (
									<div style={styles.dropdownContent}>
										{CONTEST_TYPES.map((contestType) => (
											<div
												key={contestType.value}
												onClick={() =>
													handleContestTypeToggle(contestType.value)
												}
												style={{
													...styles.checkboxItem,
													...(hoverState[`contest-${contestType.value}`] &&
														styles.checkboxItemHover),
												}}
												onMouseEnter={() =>
													handleMouseEnter(`contest-${contestType.value}`)
												}
												onMouseLeave={() =>
													handleMouseLeave(`contest-${contestType.value}`)
												}
											>
												<input
													type="checkbox"
													id={contestType.value}
													style={styles.checkbox}
													checked={selectedContestTypes.includes(
														contestType.value,
													)}
													readOnly
												/>
												<div>
													<label
														htmlFor={contestType.value}
														style={{ fontWeight: "500", cursor: "pointer" }}
													>
														{contestType.label}
													</label>
													<p
														style={{
															fontSize: "0.85rem",
															color: "#6b7280",
															margin: 0,
														}}
													>
														{contestType.description}
													</p>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						<div style={styles.spaceY2}>
							<label style={styles.label}>Problem Index</label>
							<div style={styles.dropdown}>
								<button
									onClick={() =>
										setShowProblemIndexDropdown(!showProblemIndexDropdown)
									}
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
										{selectedProblemIndices.length > 0
											? selectedProblemIndices.sort().join(", ")
											: "Select indices"}
									</span>
									<svg
										style={{
											...styles.icon,
											width: "1rem",
											height: "1rem",
											transition: "transform 0.2s",
											transform: showProblemIndexDropdown
												? "rotate(180deg)"
												: "rotate(0deg)",
										}}
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
									>
										<polyline points="6,9 12,15 18,9" />
									</svg>
								</button>
								{showProblemIndexDropdown && (
									<div style={{ ...styles.dropdownContent, padding: "1rem" }}>
										<div style={styles.problemIndexGrid}>
											{PROBLEM_INDICES.map((problemIndex) => (
												<div
													key={problemIndex.value}
													onClick={() =>
														handleProblemIndexToggle(problemIndex.value)
													}
													title={problemIndex.description}
													style={{
														...styles.problemIndexItem,
														...(selectedProblemIndices.includes(
															problemIndex.value,
														) && styles.problemIndexItemSelected),
														...(hoverState[`index-${problemIndex.value}`] &&
															!selectedProblemIndices.includes(
																problemIndex.value,
															) &&
															styles.problemIndexItemHover),
													}}
													onMouseEnter={() =>
														handleMouseEnter(`index-${problemIndex.value}`)
													}
													onMouseLeave={() =>
														handleMouseLeave(`index-${problemIndex.value}`)
													}
												>
													<div
														style={{ fontWeight: "600", fontSize: "1.1rem" }}
													>
														{problemIndex.label}
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>

						<div style={styles.spaceY2}>
							<label style={styles.label}>Problem Sheets</label>
							<div style={styles.dropdown}>
								<button
									onClick={() => setShowSheetsDropdown(!showSheetsDropdown)}
									style={{
										...styles.btn,
										width: "100%",
										justifyContent: "space-between",
										...(hoverState.sheetsBtn && styles.btnHover),
									}}
									onMouseEnter={() => handleMouseEnter("sheetsBtn")}
									onMouseLeave={() => handleMouseLeave("sheetsBtn")}
								>
									<span>
										{selectedSheets.length > 0
											? `${selectedSheets.length} sheet${selectedSheets.length > 1 ? "s" : ""} selected`
											: "Select sheets"}
									</span>
									<svg
										style={{
											...styles.icon,
											width: "1rem",
											height: "1rem",
											transition: "transform 0.2s",
											transform: showSheetsDropdown
												? "rotate(180deg)"
												: "rotate(0deg)",
										}}
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
									>
										<polyline points="6,9 12,15 18,9" />
									</svg>
								</button>
								{showSheetsDropdown && (
									<div style={styles.dropdownContent}>
										{PROBLEM_SHEETS.map((sheet) => (
											<div
												key={sheet.value}
												onClick={() => handleSheetToggle(sheet.value)}
												style={{
													...styles.checkboxItem,
													...(hoverState[`sheet-${sheet.value}`] &&
														styles.checkboxItemHover),
												}}
												onMouseEnter={() =>
													handleMouseEnter(`sheet-${sheet.value}`)
												}
												onMouseLeave={() =>
													handleMouseLeave(`sheet-${sheet.value}`)
												}
											>
												<input
													type="checkbox"
													id={sheet.value}
													style={styles.checkbox}
													checked={selectedSheets.includes(sheet.value)}
													readOnly
												/>
												<div>
													<label
														htmlFor={sheet.value}
														style={{ fontWeight: "500", cursor: "pointer" }}
													>
														{sheet.label}
													</label>
													<p
														style={{
															fontSize: "0.85rem",
															color: "#6b7280",
															margin: 0,
														}}
													>
														{sheet.description}
													</p>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						<div style={styles.spaceY2}>
							<label style={styles.label}>Combine Tags</label>
							<div style={styles.radioGroup}>
								<div
									onClick={() => setCombineMode("and")}
									style={styles.radioItem}
								>
									<input
										type="radio"
										id="and"
										name="combine"
										value="and"
										style={styles.radio}
										checked={combineMode === "and"}
										readOnly
									/>
									<label
										htmlFor="and"
										style={{ fontSize: "0.95rem", cursor: "pointer" }}
									>
										AND
									</label>
								</div>
								<div
									onClick={() => setCombineMode("or")}
									style={styles.radioItem}
								>
									<input
										type="radio"
										id="or"
										name="combine"
										value="or"
										style={styles.radio}
										checked={combineMode === "or"}
										readOnly
									/>
									<label
										htmlFor="or"
										style={{ fontSize: "0.95rem", cursor: "pointer" }}
									>
										OR
									</label>
								</div>
							</div>
						</div>
					</div>

					{selectedTags.length > 0 && (
						<div style={styles.spaceY2}>
							<label style={styles.label}>Selected Tags</label>
							<div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
								{selectedTags.map((tagValue) => {
									const tag = ALGORITHM_TAGS.find((t) => t.value === tagValue);
									return (
										<span key={tagValue} style={styles.badge}>
											{tag?.label}
											<button
												onClick={() => removeTag(tagValue)}
												style={{
													background: "none",
													border: "none",
													color: "inherit",
													cursor: "pointer",
													display: "flex",
													alignItems: "center",
												}}
											>
												<svg
													style={styles.iconSm}
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="3"
												>
													<line x1="18" y1="6" x2="6" y2="18" />
													<line x1="6" y1="6" x2="18" y2="18" />
												</svg>
											</button>
										</span>
									);
								})}
							</div>
						</div>
					)}

					<div>
						<button
							onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
							style={{
								...styles.btn,
								...styles.btnGhost,
								width: "100%",
								justifyContent: "space-between",
								padding: "0.25rem",
								...(hoverState.advancedBtn && styles.btnGhostHover),
							}}
							onMouseEnter={() => handleMouseEnter("advancedBtn")}
							onMouseLeave={() => handleMouseLeave("advancedBtn")}
						>
							<div
								style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
							>
								<svg
									style={styles.icon}
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
								>
									<circle cx="12" cy="12" r="3" />
									<path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
								</svg>
								<span style={{ fontSize: "0.95rem", fontWeight: "500" }}>
									Advanced Tag Selection
								</span>
							</div>
							<svg
								style={{
									...styles.icon,
									width: "1.5rem",
									height: "1.5rem",
									transition: "transform 0.2s",
									transform: isAdvancedOpen ? "rotate(180deg)" : "rotate(0deg)",
								}}
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
							>
								<polyline points="6,9 12,15 18,9" />
							</svg>
						</button>

						{isAdvancedOpen && (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "1rem",
									marginTop: "1rem",
								}}
							>
								<div style={styles.separator}></div>
								<div style={styles.spaceY2}>
									<label style={styles.label}>Search Tags</label>
									<input
										placeholder="Search algorithm tags..."
										value={tagSearchQuery}
										onChange={(e) => setTagSearchQuery(e.target.value)}
										style={{
											...styles.input,
											...(focusState.tagSearch && styles.inputFocus),
										}}
										onFocus={() => handleFocus("tagSearch")}
										onBlur={() => handleBlur("tagSearch")}
									/>
								</div>
								<div style={styles.scrollArea}>
									<div style={getTagGridStyle()}>
										{filteredTags.map((tag) => (
											<div
												key={tag.value}
												onClick={() => handleTagToggle(tag.value)}
												style={{
													...styles.tagGridItem,
													...(selectedTags.includes(tag.value) &&
														styles.tagGridItemSelected),
													...(hoverState[`tag-${tag.value}`] &&
														!selectedTags.includes(tag.value) &&
														styles.tagGridItemHover),
												}}
												onMouseEnter={() =>
													handleMouseEnter(`tag-${tag.value}`)
												}
												onMouseLeave={() =>
													handleMouseLeave(`tag-${tag.value}`)
												}
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
														<div
															style={{ fontSize: "0.95rem", fontWeight: "500" }}
														>
															{tag.label}
														</div>
														<div
															style={{ fontSize: "0.85rem", color: "#6b7280" }}
														>
															{tag.description}
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						)}
					</div>

					<div style={{ ...styles.borderT, display: "flex", gap: "0.75rem" }}>
						<button
							onClick={handleApplyFilters}
							style={{
								...styles.btn,
								...styles.btnLg,
								...styles.btnPrimary,
								flex: 1,
								...(hoverState.applyBtn && styles.btnPrimaryHover),
							}}
							onMouseEnter={() => handleMouseEnter("applyBtn")}
							onMouseLeave={() => handleMouseLeave("applyBtn")}
						>
							<svg
								style={styles.icon}
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
							>
								<polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
							</svg>
							Apply Filters
						</button>
						<button
							onClick={handleAutoRecommend}
							style={{
								...styles.btn,
								...styles.btnLg,
								...styles.btnGradient,
								flex: 1,
								...(hoverState.recommendBtn && styles.btnGradientHover),
							}}
							onMouseEnter={() => handleMouseEnter("recommendBtn")}
							onMouseLeave={() => handleMouseLeave("recommendBtn")}
						>
							<svg
								style={styles.icon}
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
							>
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
							</svg>
							Auto Recommend
						</button>
					</div>

					<div style={styles.filterSummary}>
						<strong style={{ color: "#374151" }}>Active Filters:</strong>
						{minDifficulty || maxDifficulty
							? ` Difficulty: ${minDifficulty || "Any"}-${maxDifficulty || "Any"}`
							: ""}
						{selectedContestTypes.length > 0
							? ` • Contest Types: ${selectedContestTypes.length}`
							: ""}
						{selectedProblemIndices.length > 0
							? ` • Indices: ${selectedProblemIndices.sort().join(", ")}`
							: ""}
						{selectedSheets.length > 0
							? ` • Sheets: ${selectedSheets.length}`
							: ""}
						{selectedTags.length > 0 ? ` • Tags: ${selectedTags.length}` : ""}
						{!minDifficulty &&
						!maxDifficulty &&
						selectedContestTypes.length === 0 &&
						selectedProblemIndices.length === 0 &&
						selectedSheets.length === 0 &&
						selectedTags.length === 0
							? " None"
							: ""}
					</div>
				</div>
			</div>
		</div>
	);
}
