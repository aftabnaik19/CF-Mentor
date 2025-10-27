/* eslint-disable simple-import-sort/imports */
import { useConnectionStore } from "@/shared/stores/connectionStore";

import { DropdownSelector } from "./components/DropdownSelector";
import { ProblemIndexSelector } from "./components/ProblemIndexSelector";
import { TagsSelector } from "./components/TagsSelector";
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
 		isAdvancedOpen,
 		setIsAdvancedOpen,
 		tagSearchQuery,
 		setTagSearchQuery,
 		selectedContestTypes,
 		selectedProblemIndices,
 		hideTags,
 		setHideTags,
 		hideSolved,
 		setHideSolved,
 		hideStatusColors,
 		setHideStatusColors,
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

	const getTagGridStyle = () => {
		let gridTemplateColumns = "repeat(1, 1fr)";
		if (windowWidth >= 1024) gridTemplateColumns = "repeat(3, 1fr)";
		else if (windowWidth >= 768) gridTemplateColumns = "repeat(2, 1fr)";
		return { display: "grid", gap: "0.5rem", gridTemplateColumns };
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

							<DropdownSelector
								isOpen={showContestTypeDropdown}
								setIsOpen={setShowContestTypeDropdown}
								title="Contest Type"
								selectedItems={selectedContestTypes}
								items={availableContestTypes.map((type) => ({
									value: type,
									label: type,
									description: type, // Added missing property
								}))}
								onItemToggle={handleContestTypeToggle}
								hoverState={hoverState}
								handleMouseEnter={handleMouseEnter}
								handleMouseLeave={handleMouseLeave}
							/>

							<ProblemIndexSelector
								isOpen={showProblemIndexDropdown}
								setIsOpen={setShowProblemIndexDropdown}
								selectedIndices={selectedProblemIndices}
								onIndexToggle={handleProblemIndexToggle}
								problemIndices={availableProblemIndices}
								hoverState={hoverState}
								handleMouseEnter={handleMouseEnter}
								handleMouseLeave={handleMouseLeave}
							/>

							<DropdownSelector
								isOpen={showSheetsDropdown}
								setIsOpen={setShowSheetsDropdown}
								title="Problem Sheets"
								selectedItems={selectedSheets}
								items={availableSheetNames.map((name) => ({
									value: name,
									label: name,
									description: name, // Added missing property
								}))}
								onItemToggle={handleSheetToggle}
								hoverState={hoverState}
								handleMouseEnter={handleMouseEnter}
								handleMouseLeave={handleMouseLeave}
							/>

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

 							<div style={styles.spaceY2}>
 								<label style={styles.label}>Visibility Controls</label>
 								<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
 									<label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", cursor: "pointer" }}>
 										<input
 											type="checkbox"
 											checked={!hideTags}
 											onChange={() => setHideTags(!hideTags)}
 											style={{ margin: 0 }}
 										/>
 										Show Tags
 									</label>
 									<label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", cursor: "pointer" }}>
 										<input
 											type="checkbox"
 											checked={!hideSolved}
 											onChange={() => setHideSolved(!hideSolved)}
 											style={{ margin: 0 }}
 										/>
 										Show Solved Problems
 									</label>
 									<label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", cursor: "pointer" }}>
 										<input
 											type="checkbox"
 											checked={!hideStatusColors}
 											onChange={() => setHideStatusColors(!hideStatusColors)}
 											style={{ margin: 0 }}
 										/>
 										Show Status Colors
 									</label>
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
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
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
										transform: isAdvancedOpen
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
											onChange={(e) =>
												setTagSearchQuery(
													(e.target as HTMLInputElement).value,
												)
											}
											style={{
												...styles.input,
												...(focusState.tagSearch && styles.inputFocus),
											}}
											onFocus={() => handleFocus("tagSearch")}
											onBlur={() => handleBlur("tagSearch")}
										/>
									</div>
									<TagsSelector
										filteredTags={filteredTags.map((tag) => ({
											value: tag,
											label: tag,
											description: "", // No description available in this dynamic setup
										}))}
										selectedTags={selectedTags}
										onTagToggle={handleTagToggle}
										hoverState={hoverState}
										handleMouseEnter={handleMouseEnter}
										handleMouseLeave={handleMouseLeave}
										getTagGridStyle={getTagGridStyle}
									/>
								</div>
							)}
						</div>

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