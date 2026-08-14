import { create } from "zustand";

import { ProblemFilter } from "../types/filters";

interface FilterState {
	filters: ProblemFilter;
	setFilters: (newFilters: ProblemFilter) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
	filters: {}, // Initial state is an empty filter
	setFilters: (newFilters) => set({ filters: newFilters }),
}));
