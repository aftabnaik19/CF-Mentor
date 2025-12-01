 
import "./PopupApp.css";

import { useEffect, useState } from "react";

import { EXTENSION_CONFIG } from "../shared/constants/config";
import type { FeatureFlags } from "../shared/stores/featureFlags";

type ToggleItem = {
  key: keyof FeatureFlags;
  label: string;
  description?: string;
};

const TOGGLES: ToggleItem[] = [
  { key: "problemAssistant", label: "Problem Assistant", description: "Bookmarks, notes, stopwatch on problem page" },
  { key: "stopwatch", label: "Stopwatch", description: "Show stopwatch inside Problem Assistant" },
  { key: "advancedFiltering", label: "Advance Filtering for Problemset", description: "Replace filter-by-tags and enhance data table" },
  { key: "contestHistorySummary", label: "Contest History Summary", description: "Show division-wise averages on profile page" },
  { key: "maxRatedHeatmap", label: "Max Rated Heatmap", description: "Show max problem rating instead of count on profile heatmap" },
  { key: "strongWeakTopics", label: "Strong/Weak Topics", description: "Show strong and weak topics on profile page" },
];

const Popup = () => {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [saving, setSaving] = useState(false);

  // Load flags from storage
  useEffect(() => {
    chrome.storage.local.get([EXTENSION_CONFIG.STORAGE_KEYS.FEATURE_FLAGS], (res) => {
      const stored = res[EXTENSION_CONFIG.STORAGE_KEYS.FEATURE_FLAGS] as FeatureFlags | undefined;
      const defaults: FeatureFlags = {
        problemAssistant: true,
        stopwatch: true,
        advancedFiltering: true,
        contestHistorySummary: true,
        maxRatedHeatmap: true,
        strongWeakTopics: true,
      };
      setFlags({ ...defaults, ...(stored ?? {}) });
    });
  }, []);

  const saveFlags = (next: FeatureFlags) => {
    setSaving(true);
    chrome.storage.local.set({ [EXTENSION_CONFIG.STORAGE_KEYS.FEATURE_FLAGS]: next }, () => {
      setSaving(false);
      setFlags(next);
      chrome.runtime.sendMessage({ type: "cf-mentor:feature-flags-updated", payload: next });
    });
  };

  const handleToggle = (key: keyof FeatureFlags) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!flags) return;
    const next = { ...flags, [key]: e.target.checked };
    saveFlags(next);
  };

  const handleFetchClick = () => {
    chrome.runtime.sendMessage({ action: "fetchData" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError.message);
      } else {
        console.log(response?.status ?? "ok");
      }
    });
  };

  return (
  <div className="popup-container" style={{ minWidth: 260 }}>
      <div className="popup-header">
        <div className="popup-title-text">CF Mentor</div>
      </div>
      {flags ? (
        <div className="popup-list">
          {TOGGLES.map((t) => {
            const isStopwatch = t.key === "stopwatch";
            const disabled = isStopwatch && !flags.problemAssistant;
            return (
              <label
                key={t.key}
                className={`cf-toggle${disabled ? " disabled" : ""}`}
                title={disabled ? "Enable Problem Assistant to use Stopwatch" : undefined}
              >
                <input
                  className="cf-checkbox"
                  type="checkbox"
                  checked={!!flags[t.key]}
                  onChange={handleToggle(t.key)}
                  disabled={disabled}
                />
                <div className="cf-toggle-text">
                  <span className="cf-toggle-title">{t.label}</span>
                  {t.description && (
                    <span className="cf-toggle-desc">{t.description}</span>
                  )}
                </div>
              </label>
            );
          })}
          <button className="cf-button" onClick={handleFetchClick} disabled={saving}>
            {saving ? "Saving..." : "Fetch and Log Data"}
          </button>
        </div>
      ) : (
        <div className="popup-loading">Loading settings...</div>
      )}
    </div>
  );
};

/* removed PopupCard in favor of a flat layout */
export default Popup;
