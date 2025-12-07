import { useEffect, useState } from "react";

import * as bookmarkStorage from "../utils/bookmarkStorage";
import * as domUtils from "../utils/domUtils";
import DifficultySelector from "./DifficultySelector.tsx";
import Notes from "./Notes";
import Stopwatch from "./Stopwatch";

const DRAFT_KEY = "cf_mentor_draft";
const DROPDOWN_SESSION_KEY = "cf_mentor_dropdown_open";
const ProblemAssistantPanel: React.FC = () => {
  const [difficulty, setDifficulty] = useState(0);
  const [notes, setNotes] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Time is running..!");

  // Determine current problem key
  const problemInfo = domUtils.getCurrentProblemInfo();
  const PROBLEM_KEY = problemInfo
    ? bookmarkStorage.getProblemKey(
      problemInfo.contestId,
      problemInfo.problemIdx,
    )
    : null;

  // chrome.storage.local helpers for drafts
  const getDrafts = async (): Promise<
    Record<string, { difficulty: number; notes: string }>
  > => {
    return new Promise((resolve) => {
      chrome.storage.local.get([DRAFT_KEY], (result) => {
        resolve(result[DRAFT_KEY] ?? {});
      });
    });
  };

  const setDrafts = async (
    all: Record<string, { difficulty: number; notes: string }>,
  ) => {
    return new Promise<void>((resolve) => {
      chrome.storage.local.set({ [DRAFT_KEY]: all }, () => resolve());
    });
  };

  // // Remove draft entry
  // const removeDraft = async () => {
  // 	if (!key) return;
  // 	const all = await getDrafts();
  // 	delete all[key];
  // 	await setDrafts(all);
  // };
  //
  // Save or remove draft
  const saveDraft = async (d: number, n: string) => {
    if (!PROBLEM_KEY) return;
    const isEmptyDraft = !bookmarked && d === 0 && n.trim() === "";
    const all = await getDrafts();
    if (isEmptyDraft) {
      delete all[PROBLEM_KEY];
      await setDrafts(all);
    } else {
      all[PROBLEM_KEY] = { difficulty: d, notes: n };
      await setDrafts(all);
    }
  };

  // Load initial data (bookmark or draft), and dropdown state
  useEffect(() => {
    (async () => {
      try {
        if (!PROBLEM_KEY) throw new Error("Not on problem page");
        const isBk = await bookmarkStorage.isCurrentProblemBookmarked();
        setBookmarked(isBk);

        if (isBk) {
          const bk = await bookmarkStorage.getCurrentProblemBookmark();
          if (bk) {
            setDifficulty(bk.difficultyRating ?? 0);
            setNotes(bk.notes ?? "");
          }
        } else {
          const all = await getDrafts();
          if (all[PROBLEM_KEY]) {
            setDifficulty(all[PROBLEM_KEY].difficulty);
            setNotes(all[PROBLEM_KEY].notes);
          }
        }
        // restore dropdown open state from sessionStorage
        const saved = sessionStorage.getItem(DROPDOWN_SESSION_KEY);
        setShowDropdown(saved === "true");
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [PROBLEM_KEY]);

  // Monitor status message to inject "Understand Technique" button
  useEffect(() => {
    if (statusMessage === "Check Solution") {
      const problemInfo = domUtils.getCurrentProblemInfo();
      const problemName = domUtils.getProblemName();
      const rating = domUtils.extractProblemRating() || "unknown";
      
      if (problemInfo && problemName) {
        const query = `Explain the solution for Codeforces problem ${problemName} (${problemInfo.contestId}${problemInfo.problemIdx}) and provide 4-5 similar problems with rating ${rating} for practice.`;
        const encodedQuery = encodeURIComponent(query);
        const url = `https://chatgpt.com/?q=${encodedQuery}`;
        
        const html = `
          <span>
            <a href="${url}" target="_blank" title="Ask ChatGPT">Understand Technique <span class="resource-locale" style="font-size: 0.8em; color: #888;">(AI)</span></a>
          </span>
        `;
        
        domUtils.injectContestMaterialItem(html, "cfm-understand-technique-btn");
      }
    }
  }, [statusMessage]);

  // Toggle bookmark without confirm; tooltip on hover explains retention
  const handleBookmarkToggle = async () => {
    if (!PROBLEM_KEY) return;
    if (bookmarked) {
      await bookmarkStorage.removeCurrentProblemBookmark();
      setBookmarked(false);
    } else {
      await bookmarkStorage.bookmarkCurrentProblem(
        difficulty || null,
        notes || null,
      );
      setBookmarked(true);
    }
  };

  // Handle dropdown toggle and persist in sessionStorage
  const toggleDropdown = () => {
    const next = !showDropdown;
    setShowDropdown(next);
    sessionStorage.setItem(DROPDOWN_SESSION_KEY, next ? "true" : "false");
  };

  // Difficulty change
  const handleDifficultyChange = async (d: number) => {
    setDifficulty(d);
    await saveDraft(d, notes);
    if (bookmarked) {
      await bookmarkStorage.updateCurrentProblemBookmark({
        difficultyRating: d || null,
      });
    }
  };

  // Reset difficulty
  const handleDifficultyReset = async () => {
    setDifficulty(0);
    await saveDraft(0, notes);
    if (bookmarked) {
      await bookmarkStorage.updateCurrentProblemBookmark({
        difficultyRating: null,
      });
    }
  };

  // Notes change
  const handleNotesChange = async (n: string) => {
    setNotes(n);
    await saveDraft(difficulty, n);
    if (bookmarked) {
      await bookmarkStorage.updateCurrentProblemBookmark({
        notes: n || null,
      });
    }
  };

  if (loading) {
    return (
      <div
        className="roundbox sidebox borderTopRound"
        style={{ padding: "1em" }}
      >
        <div style={{ textAlign: "center" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="roundbox sidebox borderTopRound" style={{ padding: 0 }}>
      <table className="rtable" style={{ width: "100%", margin: 0 }}>
        <tbody>
          <tr>
            <th className="left" style={{ padding: "0.5em" }}>
              <a href="https://cf-mentor.me/" style={{ color: "black" }}>
                <u>CF Mentor</u>
              </a>
            </th>
          </tr>
          <tr>
            <td className="left dark" style={{ padding: "0.5em 1em" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <div style={{ flex: 1 }} />
                <span
                  role="button"
                  tabIndex={0}
                  className="contest-state-phase"
                  title="Removing the bookmark will not remove difficulty or notes"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4em",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    color: bookmarked ? "#4CAF50" : "inherit",
                  }}
                  onClick={handleBookmarkToggle}
                >
                  {bookmarked ? "Bookmarked!" : "Bookmark Problem"}
                  <img
                    alt="Bookmark icon"
                    src={`//codeforces.org/s/46398/images/icons/star_${bookmarked ? "yellow" : "gray"
                      }_24.png`}
                    style={{ height: "1em" }}
                  />
                </span>
                <span
                  style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "flex-end",
                    cursor: "pointer",
                  }}
                  onClick={toggleDropdown}
                >
                  {showDropdown ? "▲" : "▼"}
                </span>
              </div>
            </td>
          </tr>
          {showDropdown && (
            <>
              <tr>
                <td className="left" style={{ padding: "0 1em" }}>
                  <DifficultySelector
                    difficulty={difficulty}
                    onChange={handleDifficultyChange}
                    onReset={handleDifficultyReset}
                  />
                </td>
              </tr>
              <tr>
                <td className="left" style={{ padding: "0 1em 1em" }}>
                  <Notes value={notes} onChange={handleNotesChange} />
                </td>
              </tr>
            </>
          )}
          {document.documentElement.getAttribute("data-cf-mentor-hide-stopwatch") !== "true" && (
            <>
              <tr>
                <td className="left" style={{ padding: "0em 1em" }}>
                  <Stopwatch 
                    problemKey={PROBLEM_KEY} 
                    onStatusChange={setStatusMessage}
                    onAlert={(msg) => alert(msg)}
                  />
                </td>
              </tr>
              <tr>
                <td className="left dark" style={{ padding: "0.5em 1em" }}>
                  <span className="contest-state-regular">{statusMessage}</span>
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProblemAssistantPanel;
