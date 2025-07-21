import { useEffect, useState } from "react";

import { ALGORITHM_TAGS } from "@/shared/data/filter-panel-data";
export const useAdvancedFilter = () => {
	const [minDifficulty, setMinDifficulty] = useState<string>("");
	const [maxDifficulty, setMaxDifficulty] = useState<string>("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
	const [combineMode, setCombineMode] = useState<"and" | "or">("and");
	const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
	const [tagSearchQuery, setTagSearchQuery] = useState<string>("");
	const [selectedContestTypes, setSelectedContestTypes] = useState<string[]>([]);
	const [selectedProblemIndices, setSelectedProblemIndices] = useState<string[]>([]);
	const [showContestTypeDropdown, setShowContestTypeDropdown] = useState<boolean>(false);
	const [showProblemIndexDropdown, setShowProblemIndexDropdown] =
		useState<boolean>(false);
	const [showSheetsDropdown, setShowSheetsDropdown] = useState<boolean>(false);

	// State for managing hover and focus effects for inline styling
	const [hoverState, setHoverState] = useState<Record<string, boolean>>({});
	const [focusState, setFocusState] = useState<Record<string, boolean>>({});

	// State for managing window width for responsive inline styles
	const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

	// Effect to listen for window resize to apply responsive styles
	useEffect(() => {
		const handleResize = () => setWindowWidth(window.innerWidth);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Handlers to toggle hover and focus states
	const handleMouseEnter = (key: string) =>
		setHoverState((prev) => ({ ...prev, [key]: true }));
	const handleMouseLeave = (key: string) =>
		setHoverState((prev) => ({ ...prev, [key]: false }));
	const handleFocus = (key: string) =>
		setFocusState((prev) => ({ ...prev, [key]: true }));
	const handleBlur = (key: string) =>
		setFocusState((prev) => ({ ...prev, [key]: false }));

	const filteredTags = ALGORITHM_TAGS.filter(
		(tag) =>
			tag.label.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
			tag.description.toLowerCase().includes(tagSearchQuery.toLowerCase()),
	);

	const handleTagToggle = (tagValue: string) => {
		setSelectedTags((prev) =>
			prev.includes(tagValue)
				? prev.filter((t) => t !== tagValue)
				: [...prev, tagValue],
		);
	};

	const handleSheetToggle = (sheetValue: string) => {
		setSelectedSheets((prev) =>
			prev.includes(sheetValue)
				? prev.filter((s) => s !== sheetValue)
				: [...prev, sheetValue],
		);
	};

	const handleContestTypeToggle = (contestType: string) => {
		setSelectedContestTypes((prev) =>
			prev.includes(contestType)
				? prev.filter((c) => c !== contestType)
				: [...prev, contestType],
		);
	};

	const handleProblemIndexToggle = (problemIndex: string) => {
		setSelectedProblemIndices((prev) =>
			prev.includes(problemIndex)
				? prev.filter((p) => p !== problemIndex)
				: [...prev, problemIndex],
		);
	};

	const removeTag = (tagValue: string) => {
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

	return {
		minDifficulty,
		setMinDifficulty,
		maxDifficulty,
		setMaxDifficulty,
		selectedTags,
		setSelectedTags,
		selectedSheets,
		setSelectedSheets,
		combineMode,
		setCombineMode,
		isAdvancedOpen,
		setIsAdvancedOpen,
		tagSearchQuery,
		setTagSearchQuery,
		selectedContestTypes,
		setSelectedContestTypes,
		selectedProblemIndices,
		setSelectedProblemIndices,
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
		setWindowWidth,
		handleMouseEnter,
		handleMouseLeave,
		handleFocus,
		handleBlur,
		filteredTags,
		handleTagToggle,
		handleSheetToggle,
		handleContestTypeToggle,
		handleProblemIndexToggle,
		removeTag,
		clearAllFilters,
		handleAutoRecommend,
		handleApplyFilters,
	};
};

