import { useEffect, useMemo,useState } from "react";

import { useFilterStore } from "@/shared/stores/filterStore";
import { ProblemFilter } from "@/shared/types/filters";
import { metadataService } from "@/shared/utils/metadataService";

import { useDebounce } from "./useDebounce";

export const useAdvancedFilter = () => {
	const setFilters = useFilterStore((state) => state.setFilters);
	const initialFilters = useFilterStore((state) => state.filters);

	// State for available filter options, fetched dynamically
	const [availableContestTypes, setAvailableContestTypes] = useState<string[]>(
		[],
	);
	const [availableSheetNames, setAvailableSheetNames] = useState<string[]>([]);
	const [availableTags, setAvailableTags] = useState<string[]>([]);

	// Local state for UI controls, initialized from the global store
	const [minDifficulty, setMinDifficulty] = useState<string>(
		initialFilters.cfRating?.min?.toString() || "",
	);
	const [maxDifficulty, setMaxDifficulty] = useState<string>(
		initialFilters.cfRating?.max?.toString() || "",
	);
	const [selectedTags, setSelectedTags] = useState<string[]>(
		initialFilters.tags?.values || [],
	);
	const [selectedSheets, setSelectedSheets] = useState<string[]>(
		initialFilters.sheets?.values || [],
	);
	const [combineMode, setCombineMode] = useState<"and" | "or">(
		initialFilters.tags?.mode || "and",
	);
	const [selectedContestTypes, setSelectedContestTypes] = useState<string[]>(
		initialFilters.contestType?.values || [],
	);
	const [selectedProblemIndices, setSelectedProblemIndices] = useState<
		string[]
	>(initialFilters.problemIndex?.values || []);

	// UI-specific state
	const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
	const [tagSearchQuery, setTagSearchQuery] = useState<string>("");
	const [showContestTypeDropdown, setShowContestTypeDropdown] =
		useState<boolean>(false);
	const [showProblemIndexDropdown, setShowProblemIndexDropdown] =
		useState<boolean>(false);
	const [showSheetsDropdown, setShowSheetsDropdown] = useState<boolean>(false);
	const [hoverState, setHoverState] = useState<Record<string, boolean>>({});
	const [focusState, setFocusState] = useState<Record<string, boolean>>({});
	const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

	// Fetch dynamic metadata on component mount
	useEffect(() => {
		metadataService.getFilterMetadata().then((metadata) => {
			if (metadata) {
				setAvailableContestTypes(metadata.contestTypes);
				setAvailableSheetNames(metadata.sheetNames);
				setAvailableTags(metadata.problemTags);
			}
		});
	}, []);

	// Debounce all filter inputs to avoid rapid updates
	const debouncedState = useDebounce(
		{
			minDifficulty,
			maxDifficulty,
			selectedTags,
			selectedSheets,
			combineMode,
			selectedContestTypes,
			selectedProblemIndices,
		},
		500,
	); // 500ms delay

	useEffect(() => {
		const newFilters: ProblemFilter = {};

		const min = parseInt(debouncedState.minDifficulty, 10);
		const max = parseInt(debouncedState.maxDifficulty, 10);
		if (!isNaN(min) || !isNaN(max)) {
			newFilters.cfRating = {
				min: isNaN(min) ? undefined : min,
				max: isNaN(max) ? undefined : max,
			};
		}

		if (debouncedState.selectedTags.length > 0) {
			newFilters.tags = {
				values: debouncedState.selectedTags,
				mode: debouncedState.combineMode,
			};
		}

		if (debouncedState.selectedSheets.length > 0) {
			newFilters.sheets = {
				values: debouncedState.selectedSheets,
				mode: "or", // Assuming sheets are always OR
			};
		}

		if (debouncedState.selectedContestTypes.length > 0) {
			newFilters.contestType = {
				values: debouncedState.selectedContestTypes,
				mode: "or", // Assuming contest types are always OR
			};
		}

		if (debouncedState.selectedProblemIndices.length > 0) {
			newFilters.problemIndex = {
				values: debouncedState.selectedProblemIndices,
			};
		}

		// Prevent infinite loop by only setting filters if they've changed.
		const currentFilters = useFilterStore.getState().filters;
		if (JSON.stringify(currentFilters) !== JSON.stringify(newFilters)) {
			setFilters(newFilters);
		}
	}, [debouncedState, setFilters]);

	// Effect to listen for window resize
	useEffect(() => {
		const handleResize = () => setWindowWidth(window.innerWidth);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// --- UI Handlers ---
	const handleMouseEnter = (key: string) =>
		setHoverState((prev) => ({ ...prev, [key]: true }));
	const handleMouseLeave = (key: string) =>
		setHoverState((prev) => ({ ...prev, [key]: false }));
	const handleFocus = (key: string) =>
		setFocusState((prev) => ({ ...prev, [key]: true }));
	const handleBlur = (key: string) =>
		setFocusState((prev) => ({ ...prev, [key]: false }));

	const filteredTags = useMemo(
		() =>
			availableTags.filter((tag) =>
				tag.toLowerCase().includes(tagSearchQuery.toLowerCase()),
			),
		[availableTags, tagSearchQuery],
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
		// Also clear the global state
		setFilters({});
	};

	const handleAutoRecommend = () => {
		console.log("Auto recommend triggered");
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
		availableContestTypes,
		availableSheetNames,
	};
};
