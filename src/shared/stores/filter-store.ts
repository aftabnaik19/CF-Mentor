import { create } from "zustand";

import { ProblemFilter } from "../types/filters";

interface FilterState {
	filters: ProblemFilter;
	setFilters: (newFilters: ProblemFilter) => void;
}

// A sample filter to demonstrate the feature
const sampleFilter: ProblemFilter = {
	cfRating: { min: 1200, max: 1600 },
	tags: { values: ["implementation"], mode: "and" },
};

export const useFilterStore = create<FilterState>((set) => ({
	filters: sampleFilter, // Initial state is the sample filter
	setFilters: (newFilters) => set({ filters: newFilters }),
}));
