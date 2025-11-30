import { useEffect, useState } from "react";

import { useFilterStore } from "@/shared/stores/filterStore";
import { ProblemFilter } from "@/shared/types/filters";
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

  // Display options - Read directly from store
  const hideTags = initialFilters.displayOptions?.hideTags || false;
  const hideSolved = initialFilters.displayOptions?.hideSolved || false;
  const hideStatusColors = initialFilters.displayOptions?.hideStatusColors || false;

  const setHideTags = (value: boolean) => {
    setFilters({
      ...initialFilters,
      displayOptions: {
        ...initialFilters.displayOptions,
        hideTags: value,
      },
    });
  };

  const setHideSolved = (value: boolean) => {
    setFilters({
      ...initialFilters,
      displayOptions: {
        ...initialFilters.displayOptions,
        hideSolved: value,
      },
    });
  };

  const setHideStatusColors = (value: boolean) => {
    setFilters({
      ...initialFilters,
      displayOptions: {
        ...initialFilters.displayOptions,
        hideStatusColors: value,
      },
    });
  };

  // UI-specific state
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [tagSearchQuery, setTagSearchQuery] = useState<string>("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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
  );

  useEffect(() => {
    const newFilters: ProblemFilter = { ...initialFilters }; // Start with current filters to preserve display options

    const min = parseInt(debouncedState.minDifficulty, 10);
    const max = parseInt(debouncedState.maxDifficulty, 10);
    if (!isNaN(min) || !isNaN(max)) {
      newFilters.cfRating = {
        min: isNaN(min) ? undefined : min,
        max: isNaN(max) ? undefined : max,
      };
    } else {
      delete newFilters.cfRating;
    }

    if (debouncedState.selectedTags.length > 0) {
      newFilters.tags = {
        values: debouncedState.selectedTags,
        mode: debouncedState.combineMode,
      };
    } else {
      delete newFilters.tags;
    }

    if (debouncedState.selectedSheets.length > 0) {
      newFilters.sheets = {
        values: debouncedState.selectedSheets,
        mode: "or", // Assuming sheets are always OR
      };
    } else {
      delete newFilters.sheets;
    }

    if (debouncedState.selectedContestTypes.length > 0) {
      newFilters.contestType = {
        values: debouncedState.selectedContestTypes,
        mode: "or", // Assuming contest types are always OR
      };
    } else {
      delete newFilters.contestType;
    }

    if (debouncedState.selectedProblemIndices.length > 0) {
      newFilters.problemIndex = {
        values: debouncedState.selectedProblemIndices,
      };
    } else {
      delete newFilters.problemIndex;
    }

    // Prevent infinite loop by only setting filters if they've changed.
    // We compare JSON stringified versions excluding displayOptions to avoid conflicts if needed,
    // but since we are merging, a direct comparison is safer if we trust the merge.
    // However, since we are now modifying newFilters based on debounced state, we should just check if the *filter* parts changed.

    // Simplification: Just set the filters. The debounce handles the rapid firing.
    // The store update will trigger a re-render, but since we read directly from store for display options,
    // and local state for others, it should be stable.

    const currentFilters = useFilterStore.getState().filters;

    // We need to ensure we don't overwrite displayOptions with stale data if they changed elsewhere
    // But 'initialFilters' in the dependency array ensures we have the latest.
    // Wait, 'initialFilters' is from the store hook, so it updates on store change.
    // If we include it in dependency array, we might loop if we setFilters -> store updates -> hook updates -> effect runs.
    // We need to be careful.

    // Strategy: Only update if the *debounced* parts are different from what's in the store.

    let hasChanges = false;

    // Helper to compare
    const isDifferent = (a: any, b: any) => JSON.stringify(a) !== JSON.stringify(b);

    if (isDifferent(newFilters.cfRating, currentFilters.cfRating)) hasChanges = true;
    if (isDifferent(newFilters.tags, currentFilters.tags)) hasChanges = true;
    if (isDifferent(newFilters.sheets, currentFilters.sheets)) hasChanges = true;
    if (isDifferent(newFilters.contestType, currentFilters.contestType)) hasChanges = true;
    if (isDifferent(newFilters.problemIndex, currentFilters.problemIndex)) hasChanges = true;

    if (hasChanges) {
      setFilters(newFilters);
    }
  }, [debouncedState, setFilters]); // Removed initialFilters from dependency to avoid loop

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

    // Reset display options directly
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
    activeDropdown,
    setActiveDropdown,
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