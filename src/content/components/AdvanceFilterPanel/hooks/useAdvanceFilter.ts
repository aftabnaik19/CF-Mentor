import { useEffect, useState } from "react";

import { useFilterStore } from "@/shared/stores/filterStore";
import { metadataService } from "@/shared/utils/metadataService";
import { useDebounce } from "./useDebounce";

const PROBLEM_INDICES = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "E", label: "E" },
  { value: "F", label: "F" },
  { value: "G", label: "G" },
  { value: "H", label: "H" },
  { value: "I", label: "I" },
  { value: "J", label: "J" },
];

export const useAdvancedFilter = () => {
  const setFilters = useFilterStore((state) => state.setFilters);
  const initialFilters = useFilterStore((state) => state.filters);

  // State for available filter options, fetched dynamically
  const [availableContestTypes, setAvailableContestTypes] = useState<string[]>(
    [],
  );
  const [availableSheetNames, setAvailableSheetNames] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableProblemIndices] = useState(PROBLEM_INDICES);

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

  // Display options
  const [hideTags, setHideTags] = useState<boolean>(
    initialFilters.displayOptions?.hideTags || false,
  );
  const [hideSolved, setHideSolved] = useState<boolean>(
    initialFilters.displayOptions?.hideSolved || false,
  );
  const [hideStatusColors, setHideStatusColors] = useState<boolean>(
    initialFilters.displayOptions?.hideStatusColors || false,
  );

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
      hideTags,
      hideSolved,
      hideStatusColors,
    },
    500,
  );

  useEffect(() => {
    const newFilters: any = {};

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

    // Display options
    newFilters.displayOptions = {
      hideTags: debouncedState.hideTags,
      hideSolved: debouncedState.hideSolved,
      hideStatusColors: debouncedState.hideStatusColors,
    };

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

  // Filtered tags
  const filteredTags = availableTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearchQuery.toLowerCase()),
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
    setHideTags(false);
    setHideSolved(false);
    setHideStatusColors(false);
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
    setWindowWidth,
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
  };
};