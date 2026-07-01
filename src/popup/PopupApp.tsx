
import "./PopupApp.css";

import { useEffect, useState } from "react";

import { EXTENSION_CONFIG } from "../shared/constants/config";
import type { FeatureFlags } from "../shared/stores/featureFlags";
import { authenticateWithGoogle } from "./service/googleCloudAuthentication";
import { createGoogleSheet, exportBookmarksToSheet } from "./service/createAndFillGoogleSheet";
import { MESSAGE_TYPES } from "@/shared/constants/messages";
import type { Problem } from "@/shared/types/mentor";
import { useRef } from 'react'; 

type ToggleItem = {
  key: keyof FeatureFlags;
  label: string;
  description?: string;
};

const lookupProblemFromDB = (contestId: string, index: string): Promise<Problem | null> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: MESSAGE_TYPES.GET_PROBLEM_FROM_DB, payload: { contestId, index } },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn("DB lookup failed:", chrome.runtime.lastError.message);
          resolve(null);
          return;
        }
        resolve(response || null);
      }
    );
  });
};

const enrichBookmarksWithMetadata = async (bookmarks: any[]): Promise<any[]> => {
  const enriched = await Promise.all(
    bookmarks.map(async (bookmark) => {
      if (bookmark.problemRating && bookmark.problemTags?.length > 0) {
        return bookmark; // Already has metadata, skip
      }
      const dbProblem = await lookupProblemFromDB(
        bookmark.contestId,
        bookmark.problemIdx
      );
      if (dbProblem) {
        return {
          ...bookmark,
          problemRating: bookmark.problemRating || (dbProblem.cfRating > 0 ? `*${dbProblem.cfRating}` : null),
          problemTags: bookmark.problemTags?.length > 0 ? bookmark.problemTags : (dbProblem.tags || []),
        };
      }
      return bookmark;
    })
  );
  return enriched;
};

const TOGGLES: ToggleItem[] = [
  { key: "problemAssistant", label: "Problem Assistant", description: "Bookmarks, notes, stopwatch on problem page" },
  { key: "stopwatch", label: "Stopwatch", description: "Show stopwatch inside Problem Assistant" },
  { key: "advancedFiltering", label: "Advance Filtering for Problemset", description: "Replace filter-by-tags and enhance data table" },
  { key: "contestHistorySummary", label: "Contest History Summary", description: "Show division-wise averages on profile page" },
  { key: "maxRatedHeatmap", label: "Max Rated Heatmap", description: "Show max problem rating instead of count on profile heatmap" },
];

const Popup = () => {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleConnectClick = async () => {
    try {
      const connectButton = document.getElementById("connect-google-sheets-button") as HTMLButtonElement;
      connectButton.disabled = true;
      connectButton.textContent = "Connecting...";
      // 1. Get the VIP pass
      const token = await authenticateWithGoogle();
      if (!token) return;

      // 2. Create the blank sheet
      const sheetDetails = await createGoogleSheet(token);
      if (!sheetDetails?.spreadsheetId) return;

      // 3. FIRST: Fetch the user's handle from LOCAL storage (using await!)
      const handleResult = await chrome.storage.local.get('userHandle');
      const handle = handleResult.userHandle;

      if (!handle) {
        console.error("No Codeforces handle found! Please make sure you are logged into the extension.");
        return;
      }

      // 4. Construct the dynamic key
      const dynamicKey = `cf_mentor_bookmarks_${handle}`;

      // 5. SECOND: Fetch the actual bookmarks from SYNC storage
      const bookmarkResult = await chrome.storage.sync.get([dynamicKey]);

      // Extract the dictionary using the dynamic key
      const storageObject = bookmarkResult[dynamicKey] || {};

      // Convert the Dictionary Object into a flat Array
      const allBookmarksArray = Object.values(storageObject.bookmarkedProblems || {});
      console.log(allBookmarksArray);

      // This fills in any missing problemRating/problemTags that weren't captured at bookmark time
      const enrichedBatch = await enrichBookmarksWithMetadata(allBookmarksArray);
      console.log("Enriched bookmarks:", enrichedBatch);

      // 6. Write data to the sheet
      if (enrichedBatch.length > 0) {
        await exportBookmarksToSheet(token, sheetDetails.spreadsheetId, enrichedBatch);
      } else {
        console.log(`No bookmarks found for handle: ${handle}`);
      }

      connectButton.disabled = false;
      connectButton.textContent = "Connect Google Sheets";
      // 7. Open the sheet so the user can see their data immediately
      chrome.tabs.create({ url: sheetDetails.spreadsheetUrl });

    } catch (error) {
      console.error("Sync workflow failed:", error);
    }
  };

  const handleExport = async () => {
      
  };
  const handleImport = async ()=>{

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
          <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>

            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
              Codeforces Sheet Sync
            </h3>

            <button
              onClick={handleConnectClick}
              id="connect-google-sheets-button"
              style={{
                backgroundColor: '#425b8f', // Matches the blue in your screenshot
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 15px',
                width: '100%',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'normal'
              }}
            >
              Connect Google Sheets
            </button>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '10px',
                marginTop: '10px'
              }}
            >
              {/* Export Button */}
              <button
                onClick={handleExport}
                style={{ flex: 1,backgroundColor: '#425b8f',color : 'white' }}
                className="your-existing-classes"
              >
                Export Bookmarks
              </button>

              {/* Import Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1,backgroundColor: '#425b8f',color:'white'}}
                className="your-existing-classes"
              >
                Import Bookmarks
              </button>

              {/* Hidden File Input */}
              <input
                type="file"
                accept=".cfbackup"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImport}
              />
            </div>

          </div>
        </div>
      ) : (
        <div className="popup-loading">Loading settings...</div>
      )}
    </div>
  );
};

/* removed PopupCard in favor of a flat layout */
export default Popup;


