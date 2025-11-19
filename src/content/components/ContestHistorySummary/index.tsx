import React, { useEffect, useState } from "react";

import { type SummaryRow, useContestSummary } from "./useContestSummary.ts";

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
  const [viewMode, setViewMode] = useState<"percent" | "counts">("counts");
  const { loading, error, summary, unknownMetaCount, contestsConsidered, letterByDivision } = useContestSummary({ handle, k, by: byMode });
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // no-op; hook reacts to handle/k
  }, [handle, k]);

  return (
    <div>
      <div className="cfm-controls">
        <div className="cfm-control-group">
          <div className="cfm-toggle-group">
            <button
              type="button"
              onClick={() => setByMode("count")}
              className={`cfm-toggle-btn ${byMode === "count" ? "active" : ""}`}
              title="Count last N contests per division"
            >
              by contests
            </button>
            <button
              type="button"
              onClick={() => setByMode("months")}
              className={`cfm-toggle-btn ${byMode === "months" ? "active" : ""}`}
              title="Include contests in the past N months per division"
            >
              by months
            </button>
          </div>
        </div>

        <div className="cfm-control-group">
          <label htmlFor="kInput" className="cfm-label">{byMode === "count" ? "Past contests:" : "Past months:"}</label>
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
            className="cfm-input"
          />
        </div>

        <div className="cfm-control-group" style={{ marginLeft: "auto" }}>
          <span className="cfm-label">View:</span>
          <div className="cfm-toggle-group">
            <button
              type="button"
              onClick={() => setViewMode("counts")}
              className={`cfm-toggle-btn ${viewMode === "counts" ? "active" : ""}`}
            >
              counts
            </button>
            <button
              type="button"
              onClick={() => setViewMode("percent")}
              className={`cfm-toggle-btn ${viewMode === "percent" ? "active" : ""}`}
            >
              percent(%)
            </button>
          </div>
        </div>
      </div>

      <div>
        {!handle && <div style={{ color: "#666", padding: 10 }}>Couldn’t determine handle from URL.</div>}
        {handle && loading && <div style={{ color: "#666", padding: 10 }}>Loading summary for {handle}…</div>}
        {handle && error && (
          <div style={{ color: "#d32f2f", padding: 10 }}>
            Failed to fetch data: {error}
            {/* @ts-ignore */}
            {error.stack && <pre style={{ fontSize: 10, overflow: "auto" }}>{error.stack}</pre>}
          </div>
        )}
        {handle && !loading && !error && (
          <div>
            <div style={{ marginBottom: 10, color: "#666", fontSize: 12 }}>
              Contests considered: <strong>{contestsConsidered}</strong>
              {unknownMetaCount > 0 && (
                <span style={{ marginLeft: 10, color: "#f57c00" }}>
                  Note: {unknownMetaCount} contest(s) missing metadata.
                </span>
              )}
            </div>
            <div style={{ overflowX: "auto", border: "1px solid #e0e0e0", borderRadius: "4px" }}>
              <table className="cfm-table">
                <thead>
                  <tr>
                    <th>Division</th>
                    <th className="numeric">Contests</th>
                    <th className="numeric">Avg attempted</th>
                    <th className="numeric">Avg solved</th>
                    <th className="numeric">Avg rating Δ</th>
                    <th className="numeric">Avg Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.length === 0 && (
                     <tr>
                       <td colSpan={6} style={{ textAlign: "center", padding: 20, color: "#888" }}>
                         No contests found in the last {k} for this handle.
                       </td>
                     </tr>
                  )}
                  {summary.map((row: SummaryRow) => (
                    <React.Fragment key={row.division}>
                       <tr
                         className="expandable"
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
                         <td>
                           <span className={`cfm-chevron ${expandedDivisions[row.division] ? "expanded" : ""}`}>▶</span>
                           <span>{row.division}</span>
                         </td>
                         <td className="numeric">{row.contests}</td>
                         <td className="numeric">{row.avgAttempted != null ? row.avgAttempted.toFixed(2) : "—"}</td>
                         <td className="numeric">{row.avgSolved != null ? row.avgSolved.toFixed(2) : "—"}</td>
                         <td className="numeric" style={{ color: row.avgRatingDelta && row.avgRatingDelta > 0 ? "green" : row.avgRatingDelta && row.avgRatingDelta < 0 ? "gray" : "inherit" }}>
                            {row.avgRatingDelta != null ? signed(row.avgRatingDelta) : "—"}
                         </td>
                         <td className="numeric">{row.avgRank != null ? row.avgRank.toFixed(0) : "—"}</td>
                       </tr>
                      {expandedDivisions[row.division] && (
                        <tr>
                            <td colSpan={6} style={{ padding: 0 }}>
                             <div className="cfm-subtable-container">
                               <table className="cfm-subtable">
                                 <colgroup>
                                   <col style={{ width: "20%" }} />
                                   {Array.from({ length: 7 }).map((_, i) => (
                                     <col key={i} style={{ width: `${(80 / 7).toFixed(3)}%` }} />
                                   ))}
                                 </colgroup>
                                 <thead>
                                   <tr>
                                     <th className="row-label">
                                       {viewMode === "percent"
                                         ? `Avg. of past ${row.contests}`
                                         : `Total of past ${row.contests}`}
                                       </th>
                                     {["A","B","C","D","E","F","G"].map((L) => (
                                       <th key={L}>{L}</th>
                                     ))}
                                   </tr>
                                 </thead>
                                 <tbody>
                                   {viewMode === "percent" && (
                                     <>
                                       <tr>
                                         <td className="row-label">Attempt (%)</td>
                                         {["A","B","C","D","E","F","G"].map((L) => (
                                           <td key={L}>
                                             {letterByDivision[row.division]?.attemptPct?.[L] != null ? `${letterByDivision[row.division]!.attemptPct[L]!.toFixed(1)}%` : "—"}
                                           </td>
                                         ))}
                                       </tr>
                                       <tr>
                                         <td className="row-label">Acceptance (%)</td>
                                         {["A","B","C","D","E","F","G"].map((L) => (
                                           <td key={L}>
                                             {letterByDivision[row.division]?.acceptancePct?.[L] != null ? `${letterByDivision[row.division]!.acceptancePct[L]!.toFixed(1)}%` : "—"}
                                           </td>
                                         ))}
                                       </tr>
                                     </>
                                   )}
                                   {viewMode === "counts" && (
                                     <>
                                       <tr>
                                         <td className="row-label">Attempt count</td>
                                         {["A","B","C","D","E","F","G"].map((L) => (
                                           <td key={L}>
                                             {letterByDivision[row.division]?.attemptCount?.[L] ?? "—"}
                                           </td>
                                         ))}
                                       </tr>
                                       <tr>
                                         <td className="row-label">Acceptance count</td>
                                         {["A","B","C","D","E","F","G"].map((L) => (
                                           <td key={L}>
                                             {letterByDivision[row.division]?.acceptanceCount?.[L] ?? "—"}
                                           </td>
                                         ))}
                                       </tr>
                                     </>
                                   )}
                                   {/* Time rows shown in both views */}
                                   <tr>
                                     <td className="row-label">Avg time to solve</td>
                                     {["A","B","C","D","E","F","G"].map((L) => (
                                       <td key={L}>
                                         {letterByDivision[row.division]?.indivTimeAvgSec?.[L] != null ? formatTime(letterByDivision[row.division]!.indivTimeAvgSec[L]!) : "—"}
                                       </td>
                                     ))}
                                   </tr>
                                   <tr>
                                     <td className="row-label">Avg cumulative time</td>
                                     {["A","B","C","D","E","F","G"].map((L) => (
                                       <td key={L}>
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
            <div className="cfm-note">
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
