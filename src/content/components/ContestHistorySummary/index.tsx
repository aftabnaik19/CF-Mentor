import React, { useEffect, useState } from "react";

import { type SummaryRow, useContestSummary } from "./useContestSummary.ts";

// Codeforces-inspired classic light theme styles
const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#fff",
  color: "#000",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  fontFamily: "Arial, sans-serif",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  borderBottom: "1px solid #f3f4f6",
  background: "#f9fafb",
};

const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 600, color: "#000" };

const bodyStyle: React.CSSProperties = { padding: 16 };

const controlInputStyle: React.CSSProperties = {
  padding: "6px 8px",
  border: "1px solid #d1d5db",
  borderRadius: 4,
  background: "#fff",
  color: "#000",
  fontSize: 14,
};
const chipStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 20,
  cursor: "pointer",
  background: "#fff",
  color: "#374151",
  fontSize: 14,
  transition: "background 0.2s",
};
const chipActive: React.CSSProperties = {
  background: "#dbeafe",
  borderColor: "#3b82f6",
  color: "#1e40af",
};

function useHandleFromUrl() {
  const path = window.location.pathname;
  const parts = path.split("/");
  const idx = parts.indexOf("profile");
  if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
  return null;
}

export default function ContestHistorySummary() {
  const handle = useHandleFromUrl();
  const [k, setK] = useState<number | null>(10);
  const [kInput, setKInput] = useState<string>("10");
  const [byMode, setByMode] = useState<"count" | "months">("count");
  const [viewMode, setViewMode] = useState<"percent" | "counts">("percent");
  const { loading, error, summary, unknownMetaCount, contestsConsidered, letterByDivision } = useContestSummary({ handle, k, by: byMode });
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // no-op; hook reacts to handle/k
  }, [handle, k]);

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>Contest History Summary</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => setByMode("count")}
              style={{ ...chipStyle, ...(byMode === "count" ? chipActive : {}) }}
              title="Count last N contests per division"
            >
              by contests
            </button>
            <button
              type="button"
              onClick={() => setByMode("months")}
              style={{ ...chipStyle, ...(byMode === "months" ? chipActive : {}) }}
              title="Include contests in the past N months per division"
            >
              by months
            </button>
          </div>
          <label htmlFor="kInput" style={{ fontSize: 12, color: "#374151" }}>{byMode === "count" ? "Past contests:" : "Past months:"}</label>
            <input
              id="kInput"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder={byMode === "count" ? "10" : "6"}
              value={kInput}
            onChange={(e) => {
              const val = e.target.value;
              setKInput(val);
              // Apply immediately when the value is a valid integer >= 1
              const n = parseInt(val, 10);
              if (Number.isFinite(n) && n >= 1) {
                setK(n);
              }
            }}
            onBlur={() => {
              const n = parseInt(kInput, 10);
              const valid = Number.isFinite(n) && n >= 1;
              const fallback = byMode === "count" ? 10 : 6;
              const next = valid ? n : fallback;
              setK(next);
              setKInput(String(next));
            }}
            style={{ ...controlInputStyle, width: 72 }}
          />
          <div style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#374151" }}>View:</span>
            <button
              type="button"
              onClick={() => setViewMode("percent")}
              style={{ ...chipStyle, ...(viewMode === "percent" ? chipActive : {}) }}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => setViewMode("counts")}
              style={{ ...chipStyle, ...(viewMode === "counts" ? chipActive : {}) }}
            >
              counts
            </button>
          </div>
        </div>
      </div>
      <div style={bodyStyle}>
  {!handle && <div style={{ color: "#ccc" }}>Couldn’t determine handle from URL.</div>}
        {handle && loading && <div style={{ color: "#ccc" }}>Loading summary for {handle}…</div>}
        {handle && error && (
          <div style={{ color: "#ff6b6b" }}>
            Failed to fetch data: {error}
          </div>
        )}
        {handle && !loading && !error && (
          <div>
            <div style={{ marginBottom: 8, color: "#ccc", fontSize: 13 }}>
              Contests considered: {contestsConsidered}
              {unknownMetaCount > 0 && (
                <span style={{ marginLeft: 8, color: "#ffcc00" }}>
                  Note: {unknownMetaCount} contest(s) missing metadata; in-contest filtering may be approximate.
                </span>
              )}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="standings" style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", color: "#374151" }}>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Division</th>
                    <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Contests</th>
                    <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Avg attempted</th>
                    <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Avg solved</th>
                    <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Avg rating Δ</th>
                    <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Average Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.length === 0 && (
                     <tr>
                       <td colSpan={6} style={{ padding: 12, textAlign: "center", color: "#aaa" }}>
                         No contests found in the last {k} for this handle.
                       </td>
                     </tr>
                  )}
                  {summary.map((row: SummaryRow) => (
                    <React.Fragment key={row.division}>
                       <tr
                         style={{ cursor: "pointer", background: "#fff" }}
                         onClick={() => setExpandedDivisions((prev) => ({ ...prev, [row.division]: !prev[row.division] }))}
                         tabIndex={0}
                         role="button"
                         onKeyDown={(e) => {
                           if (e.key === "Enter" || e.key === " ") {
                             e.preventDefault();
                             setExpandedDivisions((prev) => ({ ...prev, [row.division]: !prev[row.division] }));
                           }
                         }}
                       >
                         <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 6, color: "#000" }}>
                           <svg
                             viewBox="0 0 24 24"
                             width="14"
                             height="14"
                             style={{ transform: expandedDivisions[row.division] ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", color: "#666" }}
                             aria-hidden="true"
                           >
                             <polyline points="6,9 12,15 18,9" fill="none" stroke="currentColor" strokeWidth="2" />
                           </svg>
                           <span>{row.division}</span>
                         </td>
                         <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6", textAlign: "right", color: "#374151" }}>{row.contests}</td>
                         <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6", textAlign: "right", color: "#374151" }}>{row.avgAttempted != null ? row.avgAttempted.toFixed(2) : "—"}</td>
                         <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6", textAlign: "right", color: "#374151" }}>{row.avgSolved != null ? row.avgSolved.toFixed(2) : "—"}</td>
                         <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6", textAlign: "right", color: "#374151" }}>{row.avgRatingDelta != null ? signed(row.avgRatingDelta) : "—"}</td>
                         <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6", textAlign: "right", color: "#374151" }}>{row.avgRank != null ? row.avgRank.toFixed(0) : "—"}</td>
                       </tr>
                      {expandedDivisions[row.division] && (
                        <tr>
                            <td colSpan={6} style={{ padding: 8, background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
                             <div style={{ overflowX: "auto" }}>
                               <table
                                 className="standings"
                                 style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", background: "#fff" }}
                               >
                                 <colgroup>
                                   <col style={{ width: "28%" }} />
                                   {Array.from({ length: 7 }).map((_, i) => (
                                     <col key={i} style={{ width: `${(72 / 7).toFixed(3)}%` }} />
                                   ))}
                                 </colgroup>
                                 <thead>
                                   <tr style={{ background: "#f9fafb", color: "#374151" }}>
                                     <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>
                                       {viewMode === "percent"
                                         ? `Metric (Avg. of past ${row.contests} contest${row.contests === 1 ? "" : "s"})`
                                         : `Metric (Past ${row.contests} contest${row.contests === 1 ? "" : "s"})`}
                                       </th>
                                     {["A","B","C","D","E","F","G"].map((L) => (
                                       <th key={L} style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>{L}</th>
                                     ))}
                                   </tr>
                                 </thead>
                                 <tbody>
                                   {viewMode === "percent" && (
                                     <>
                                       <tr style={{ background: "#fff" }}>
                                         <td style={{ padding: 8, color: "#374151" }}>Attempt (%)</td>
                                         {["A","B","C","D","E","F","G"].map((L) => (
                                           <td key={L} style={{ padding: 8, textAlign: "right", color: "#374151", borderBottom: "1px solid #f3f4f6" }}>
                                             {letterByDivision[row.division]?.attemptPct?.[L] != null ? `${letterByDivision[row.division]!.attemptPct[L]!.toFixed(1)}%` : "—"}
                                           </td>
                                         ))}
                                       </tr>
                                       <tr style={{ background: "#f9fafb" }}>
                                         <td style={{ padding: 8, color: "#374151" }}>Acceptance (%)</td>
                                         {["A","B","C","D","E","F","G"].map((L) => (
                                           <td key={L} style={{ padding: 8, textAlign: "right", color: "#374151", borderBottom: "1px solid #f3f4f6" }}>
                                             {letterByDivision[row.division]?.acceptancePct?.[L] != null ? `${letterByDivision[row.division]!.acceptancePct[L]!.toFixed(1)}%` : "—"}
                                           </td>
                                         ))}
                                       </tr>
                                     </>
                                   )}
                                   {viewMode === "counts" && (
                                     <>
                                       <tr style={{ background: "#fff" }}>
                                         <td style={{ padding: 8, color: "#374151" }}>Attempt count</td>
                                         {["A","B","C","D","E","F","G"].map((L) => (
                                           <td key={L} style={{ padding: 8, textAlign: "right", color: "#374151", borderBottom: "1px solid #f3f4f6" }}>
                                             {letterByDivision[row.division]?.attemptCount?.[L] ?? "—"}
                                           </td>
                                         ))}
                                       </tr>
                                       <tr style={{ background: "#f9fafb" }}>
                                         <td style={{ padding: 8, color: "#374151" }}>Acceptance count</td>
                                         {["A","B","C","D","E","F","G"].map((L) => (
                                           <td key={L} style={{ padding: 8, textAlign: "right", color: "#374151", borderBottom: "1px solid #f3f4f6" }}>
                                             {letterByDivision[row.division]?.acceptanceCount?.[L] ?? "—"}
                                           </td>
                                         ))}
                                       </tr>
                                     </>
                                   )}
                                   {/* Time rows shown in both views */}
                                   <tr style={{ background: "#fff" }}>
                                     <td style={{ padding: 8, color: "#374151" }}>Avg time to solve</td>
                                     {["A","B","C","D","E","F","G"].map((L) => (
                                       <td key={L} style={{ padding: 8, textAlign: "right", color: "#374151", borderBottom: "1px solid #f3f4f6" }}>
                                         {letterByDivision[row.division]?.indivTimeAvgSec?.[L] != null ? formatTime(letterByDivision[row.division]!.indivTimeAvgSec[L]!) : "—"}
                                       </td>
                                     ))}
                                   </tr>
                                   <tr style={{ background: "#f9fafb" }}>
                                     <td style={{ padding: 8, color: "#374151" }}>Avg cumulative time</td>
                                     {["A","B","C","D","E","F","G"].map((L) => (
                                       <td key={L} style={{ padding: 8, textAlign: "right", color: "#374151", borderBottom: "1px solid #f3f4f6" }}>
                                         {letterByDivision[row.division]?.cumulTimeAvgSec?.[L] != null ? formatTime(letterByDivision[row.division]!.cumulTimeAvgSec[L]!) : "—"}
                                       </td>
                                     ))}
                                   </tr>
                                 </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 8, color: "#aaa", fontSize: 12 }}>
              Tip: click a division row to toggle per-letter breakdown. Use the View toggle to switch % vs counts.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function signed(x: number): string {
  const v = x.toFixed(1);
  return x > 0 ? `+${v}` : v;
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "—";
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  const pad = (x: number) => (x < 10 ? `0${x}` : `${x}`);
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}
