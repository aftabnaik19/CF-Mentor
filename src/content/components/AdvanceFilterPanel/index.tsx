import { useConnectionStore } from "@/shared/stores/connectionStore";

import { Dropdown } from "./components/Dropdown";

import { useAdvancedFilter } from "./hooks/useAdvanceFilter";
import { styles } from "./styles";
export default function AdvanceFilterPanel() {
	const isConnected = useConnectionStore((state) => state.isConnected);
 	const {
 		minDifficulty,
 		setMinDifficulty,
 		maxDifficulty,
 		setMaxDifficulty,
 		selectedTags,
 		selectedSheets,
 		combineMode,
 		setCombineMode,
 		showTagsDropdown,
 		setShowTagsDropdown,
 		tagSearchQuery,
 		setTagSearchQuery,
 		selectedContestTypes,
 		selectedProblemIndices,

 		showContestTypeDropdown,
 		setShowContestTypeDropdown,
 		showProblemIndexDropdown,
 		setShowProblemIndexDropdown,
 		showSheetsDropdown,
 		setShowSheetsDropdown,
  		hoverState,
  		setHoverState,
  		focusState,
  		setFocusState,
  		windowWidth,
  		filteredTags,
 		handleTagToggle,
 		handleSheetToggle,
 		handleContestTypeToggle,
 		handleProblemIndexToggle,
 		removeTag,
 		clearAllFilters,
 		handleAutoRecommend,
 		availableContestTypes,
 		availableSheetNames,
 		availableProblemIndices,
		setSelectedTags,
		setSelectedContestTypes,
		setSelectedProblemIndices,
		setSelectedSheets,
  	} = useAdvancedFilter();

  const handleMouseEnter = (key: string) => {
 		setHoverState((prev: Record<string, boolean>) => ({ ...prev, [key]: true }));
 	};
 	const handleMouseLeave = (key: string) => {
 		setHoverState((prev: Record<string, boolean>) => ({ ...prev, [key]: false }));
 	};
 	const handleFocus = (key: string) => {
 		setFocusState((prev: Record<string, boolean>) => ({ ...prev, [key]: true }));
 	};
 	const handleBlur = (key: string) => {
 		setFocusState((prev: Record<string, boolean>) => ({ ...prev, [key]: false }));
 	};

 	// Functions to generate responsive styles based on window width
	const getQuickFiltersGridStyle = () => {
		let gridTemplateColumns = "repeat(1, 1fr)";
		if (windowWidth >= 768) {
			gridTemplateColumns = "repeat(auto-fit, minmax(200px, 1fr))";
		}
		return { display: "grid", gap: "1rem", gridTemplateColumns };
	};



	const rootStyle: React.CSSProperties = {
		maxWidth: "1024px",
		margin: "0 auto",
		width: "100%",
		...(!isConnected && { pointerEvents: "none", opacity: 0.7 }),
	};

	return (
		<div style={rootStyle}>
				<div style={styles.card}>
					<div style={styles.cardHeader}>
						<h2 style={styles.cardTitle}>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.75rem",
								}}
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
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<input
										type="number"
										placeholder="Min"
										value={minDifficulty}
										onChange={(e) =>
											setMinDifficulty((e.target as HTMLInputElement).value)
										}
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
										onChange={(e) =>
											setMaxDifficulty((e.target as HTMLInputElement).value)
										}
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

							<Dropdown
								title="Contest Type"
								isOpen={showContestTypeDropdown}
								setIsOpen={setShowContestTypeDropdown}
								selectedCount={selectedContestTypes.length}
								hoverState={hoverState}
								handleMouseEnter={handleMouseEnter}
								handleMouseLeave={handleMouseLeave}
								onClear={() => setSelectedContestTypes([])}
							>
								{availableContestTypes.map((type) => (
									<div
										key={type}
										onClick={() => handleContestTypeToggle(type)}
										style={{
											...styles.checkboxItem,
											...(hoverState[`Contest Type-${type}`] &&
												styles.checkboxItemHover),
										}}
										onMouseEnter={() => handleMouseEnter(`Contest Type-${type}`)}
										onMouseLeave={() => handleMouseLeave(`Contest Type-${type}`)}
									>
										<input
											type="checkbox"
											id={type}
											style={styles.checkbox}
											checked={selectedContestTypes.includes(type)}
											readOnly
										/>
										<div>
											<label
												style={{ fontWeight: "500", cursor: "pointer" }}
											>
												{type}
											</label>
											<p
												style={{
													fontSize: "0.85rem",
													color: "#6b7280",
													margin: 0,
												}}
											>
												{type}
											</p>
										</div>
									</div>
								))}
							</Dropdown>

							<Dropdown
								title="Problem Index"
								isOpen={showProblemIndexDropdown}
								setIsOpen={setShowProblemIndexDropdown}
								selectedCount={selectedProblemIndices.length}
								hoverState={hoverState}
								handleMouseEnter={handleMouseEnter}
								handleMouseLeave={handleMouseLeave}
								onClear={() => setSelectedProblemIndices([])}
							>
								<div style={styles.problemIndexGrid}>
									{availableProblemIndices.map((problemIndex) => (
										<div
											key={problemIndex.value}
											onClick={() => handleProblemIndexToggle(problemIndex.value)}
											style={{
												...styles.problemIndexItem,
												...(selectedProblemIndices.includes(problemIndex.value) &&
													styles.problemIndexItemSelected),
												...(hoverState[`index-${problemIndex.value}`] &&
													!selectedProblemIndices.includes(problemIndex.value) &&
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
							</Dropdown>

							<Dropdown
								title="Problem Sheets"
								isOpen={showSheetsDropdown}
								setIsOpen={setShowSheetsDropdown}
								selectedCount={selectedSheets.length}
								hoverState={hoverState}
								handleMouseEnter={handleMouseEnter}
								handleMouseLeave={handleMouseLeave}
								onClear={() => setSelectedSheets([])}
							>
								{availableSheetNames.map((name) => (
									<div
										key={name}
										onClick={() => handleSheetToggle(name)}
										style={{
											...styles.checkboxItem,
											...(hoverState[`Problem Sheets-${name}`] &&
												styles.checkboxItemHover),
										}}
										onMouseEnter={() => handleMouseEnter(`Problem Sheets-${name}`)}
										onMouseLeave={() => handleMouseLeave(`Problem Sheets-${name}`)}
									>
										<input
											type="checkbox"
											id={name}
											style={styles.checkbox}
											checked={selectedSheets.includes(name)}
											readOnly
										/>
										<div>
											<label
												style={{ fontWeight: "500", cursor: "pointer" }}
											>
												{name}
											</label>
											<p
												style={{
													fontSize: "0.85rem",
													color: "#6b7280",
													margin: 0,
												}}
											>
												{name}
											</p>
										</div>
									</div>
								))}
							</Dropdown>

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
								<div
									style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
								>
									{selectedTags.map((tagValue) => (
										<span key={tagValue} style={styles.badge}>
											{tagValue}
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
									))}
								</div>
							</div>
						)}

							<Dropdown
								title="Tags"
								isOpen={showTagsDropdown}
								setIsOpen={setShowTagsDropdown}
								selectedCount={selectedTags.length}
								hoverState={hoverState}
								handleMouseEnter={handleMouseEnter}
								handleMouseLeave={handleMouseLeave}
								searchable={true}
								searchValue={tagSearchQuery}
								onSearchChange={setTagSearchQuery}
								onEnter={() => {
									if (filteredTags.length > 0) {
										handleTagToggle(filteredTags[0]);
										setTagSearchQuery("");
									}
								}}
								onClear={() => setSelectedTags([])}
							>
								{filteredTags.map((tag) => (
									<div
										key={tag}
										style={{
											...styles.checkboxItem,
											...(hoverState[`tag-${tag}`] && styles.checkboxItemHover),
										}}
										onMouseEnter={() => handleMouseEnter(`tag-${tag}`)}
										onMouseLeave={() => handleMouseLeave(`tag-${tag}`)}
										onClick={() => handleTagToggle(tag)}
									>
										<input
											type="checkbox"
											checked={selectedTags.includes(tag)}
											readOnly
											style={styles.checkbox}
										/>
										<span style={{ fontSize: "0.9rem", color: "#4b5563" }}>
											{tag}
										</span>
									</div>
								))}
							</Dropdown>

						<div
							style={{ ...styles.borderT, display: "flex", gap: "0.75rem" }}
						>
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
								? ` Difficulty: ${minDifficulty || "Any"}-${
										maxDifficulty || "Any"
								  }`
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
							{selectedTags.length > 0
								? ` • Tags: ${selectedTags.length}`
								: ""}
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