import { create } from "zustand";

import { EXTENSION_CONFIG } from "../constants/config";

export type FeatureKey =
  | "problemAssistant" // bookmark + notes + stopwatch panel
  | "stopwatch"
  | "advancedFiltering"
  | "dataTable";

export type FeatureFlags = Record<FeatureKey, boolean>;

const DEFAULT_FLAGS: FeatureFlags = {
  problemAssistant: true,
  stopwatch: true,
  advancedFiltering: true,
  dataTable: true,
};

interface FeatureFlagsState {
  flags: FeatureFlags;
  initialized: boolean;
  setFlag: (key: FeatureKey, value: boolean) => void;
  load: () => Promise<void>;
}

function loadFlagsFromStorage(): Promise<FeatureFlags> {
  return new Promise((resolve) => {
    chrome.storage.local.get([EXTENSION_CONFIG.STORAGE_KEYS.FEATURE_FLAGS], (res) => {
      const stored = res[EXTENSION_CONFIG.STORAGE_KEYS.FEATURE_FLAGS] as FeatureFlags | undefined;
      resolve({ ...DEFAULT_FLAGS, ...(stored ?? {}) });
    });
  });
}

function saveFlagsToStorage(flags: FeatureFlags): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [EXTENSION_CONFIG.STORAGE_KEYS.FEATURE_FLAGS]: flags }, () => resolve());
  });
}

export const useFeatureFlags = create<FeatureFlagsState>((set, get) => ({
  flags: DEFAULT_FLAGS,
  initialized: false,
  setFlag: (key, value) => {
    const next = { ...get().flags, [key]: value };
    set({ flags: next });
    saveFlagsToStorage(next);

    // Inform all contexts to update feature mounts in-place
    chrome.runtime?.sendMessage?.({ type: "cf-mentor:feature-flags-updated", payload: next });
  },
  load: async () => {
    const flags = await loadFlagsFromStorage();
    set({ flags, initialized: true });
  },
}));

// Utility for non-React contexts
export async function getFeatureFlags(): Promise<FeatureFlags> {
  return loadFlagsFromStorage();
}
