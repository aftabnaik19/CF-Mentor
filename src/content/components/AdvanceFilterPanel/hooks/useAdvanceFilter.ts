import { useEffect, useState, useCallback, useRef, useMemo } from "react";

import { useFilterStore } from "@/shared/stores/filterStore";
import { ProblemFilter } from "@/shared/types/filters";
import { metadataService } from "@/shared/utils/metadataService";
import { getCurrentUserHandle } from "@/content/utils/domUtils";
import { CFRatingChange } from "@/content/components/ContestHistorySummary/types";

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

  // Local state for UI controls
  // We initialize from store, but we don't sync BACK from store to local state automatically
  // to avoid fighting with the user's input.
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
      ...useFilterStore.getState().filters,
      displayOptions: {
        ...useFilterStore.getState().filters.displayOptions,
        hideTags: value,
      },
    });
  };

  const setHideSolved = (value: boolean) => {
    setFilters({
      ...useFilterStore.getState().filters,
      displayOptions: {
        ...useFilterStore.getState().filters.displayOptions,
        hideSolved: value,
      },
    });
  };

  const setHideStatusColors = (value: boolean) => {
    setFilters({
      ...useFilterStore.getState().filters,
      displayOptions: {
        ...useFilterStore.getState().filters.displayOptions,
        hideStatusColors: value,
      },
    });
  };

  // UI-specific state
  const [showTagsDropdown, setShowTagsDropdown] = useState<boolean>(false);
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

  // Memoize the state object to prevent useDebounce from resetting on every render (e.g. hover updates)
  const filterState = useMemo(() => ({
    minDifficulty,
    maxDifficulty,
    selectedTags,
    selectedSheets,
    combineMode,
    selectedContestTypes,
    selectedProblemIndices,
  }), [
    minDifficulty,
    maxDifficulty,
    selectedTags,
    selectedSheets,
    combineMode,
    selectedContestTypes,
    selectedProblemIndices,
  ]);

  // Debounce all filter inputs to avoid rapid updates
  const debouncedState = useDebounce(filterState, 500);

  // Use a ref to track the previous debounced state to avoid unnecessary updates
  const prevDebouncedStateRef = useRef(debouncedState);

  useEffect(() => {
    // Check if the state actually changed
    if (JSON.stringify(prevDebouncedStateRef.current) === JSON.stringify(debouncedState)) {
      return;
    }
    prevDebouncedStateRef.current = debouncedState;

    const currentFilters = useFilterStore.getState().filters;
    const newFilters: ProblemFilter = { 
        ...currentFilters, // Preserve existing filters (especially displayOptions)
        // We will overwrite the specific filter sections below
    }; 

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
        mode: "or", 
      };
    } else {
        delete newFilters.sheets;
    }

    if (debouncedState.selectedContestTypes.length > 0) {
      newFilters.contestType = {
        values: debouncedState.selectedContestTypes,
        mode: "or",
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

    setFilters(newFilters);
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

  const handleTagToggle = useCallback((tagValue: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagValue)
        ? prev.filter((t) => t !== tagValue)
        : [...prev, tagValue],
    );
  }, []);

  const handleSheetToggle = useCallback((sheetValue: string) => {
    setSelectedSheets((prev) =>
      prev.includes(sheetValue)
        ? prev.filter((s) => s !== sheetValue)
        : [...prev, sheetValue],
    );
  }, []);

  const handleContestTypeToggle = useCallback((contestType: string) => {
    setSelectedContestTypes((prev) =>
      prev.includes(contestType)
        ? prev.filter((c) => c !== contestType)
        : [...prev, contestType],
    );
  }, []);

  const handleProblemIndexToggle = useCallback((problemIndex: string) => {
    setSelectedProblemIndices((prev) =>
      prev.includes(problemIndex)
        ? prev.filter((p) => p !== problemIndex)
        : [...prev, problemIndex],
    );
  }, []);

  const removeTag = useCallback((tagValue: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagValue));
  }, []);

  const clearAllFilters = useCallback(() => {
    setMinDifficulty("");
    setMaxDifficulty("");
    setSelectedTags([]);
    setSelectedSheets([]);
    setSelectedContestTypes([]);
    setSelectedProblemIndices([]);
    setCombineMode("and");
    
    // We do NOT call setFilters({}) here because that would wipe displayOptions.
    // The useEffect will pick up the empty state changes and update the store,
    // preserving the displayOptions because we spread ...currentFilters in the effect.
  }, []);

  const handleAutoRecommend = useCallback(async () => {
    const handle = getCurrentUserHandle();
    if (!handle) {
      alert("No user logged in");
      return;
    }

    try {
      const response = await new Promise<{
        success: boolean;
        rating?: CFRatingChange[];
        error?: string;
      }>((resolve) => {
        chrome.runtime.sendMessage(
          { type: "fetch-user-data", handle },
          (response) => {
            resolve(response);
          },
        );
      });

      if (response.success && response.rating && response.rating.length > 0) {
        const currentRating = response.rating[response.rating.length - 1].newRating || 0;
        
        if (currentRating > 0) {
          // Apply recommended filters
          setMinDifficulty((currentRating - 100).toString());
          setMaxDifficulty((currentRating + 300).toString());
          setSelectedContestTypes(["Edu", "Div. 2"]);
          setSelectedProblemIndices(["C", "D"]);
          setSelectedSheets(["acd", "cp31"]);
        }
      } else {
        console.error("Failed to fetch user rating or no rating data found.");
        // Fallback or alert if needed, but for now just logging error
      }
    } catch (error) {
      console.error("Error in auto recommend:", error);
    }
  }, []);

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
    showTagsDropdown,
    setShowTagsDropdown,
    tagSearchQuery,
    setTagSearchQuery,
    selectedContestTypes,
    setSelectedContestTypes,
    selectedProblemIndices,
    hideTags,
    setHideTags,
    hideSolved,
    setHideSolved,
    setSelectedProblemIndices,
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