import React, { useEffect, useState } from "react";

import { type SummaryRow, useContestSummary } from "./useContestSummary.ts";

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#fff",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  borderBottom: "1px solid #f3f4f6",
};

const titleStyle: React.CSSProperties = { fontSize: 16, fontWeight: 600 };

const bodyStyle: React.CSSProperties = { padding: 12 };

// kept for reference if we bring back number input; unused currently
// const inputStyle: React.CSSProperties = {
//   width: 80,
//   padding: "6px 8px",
//   border: "1px solid #d1d5db",
//   borderRadius: 6,
// };
const controlInputStyle: React.CSSProperties = { padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 6 };
const chipStyle: React.CSSProperties = { padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 999, cursor: "pointer", background: "#fff" };
const chipActive: React.CSSProperties = { background: "#eef2ff", borderColor: "#6366f1", color: "#3730a3" };

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
  {!handle && <div>Couldn’t determine handle from URL.</div>}
        {handle && loading && <div>Loading summary for {handle}…</div>}
        {handle && error && (
          <div style={{ color: "#b91c1c" }}>
            Failed to fetch data: {error}
          </div>
        )}
        {handle && !loading && !error && (
          <div>
            <div style={{ marginBottom: 8, color: "#374151", fontSize: 13 }}>
              Contests considered: {contestsConsidered}
              {unknownMetaCount > 0 && (
                <span style={{ marginLeft: 8, color: "#92400e" }}>
                  Note: {unknownMetaCount} contest(s) missing metadata; in-contest filtering may be approximate.
                </span>
              )}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="standings" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", color: "#374151" }}>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #f3f4f6" }}>Division</th>
                    <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #f3f4f6" }}>Contests</th>
                    <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #f3f4f6" }}>Avg attempted</th>
                    <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #f3f4f6" }}>Avg solved</th>
                    <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #f3f4f6" }}>Avg rating Δ</th>
                    <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #f3f4f6" }}>Average Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 12, textAlign: "center", color: "#6b7280" }}>
                        No contests found in the last {k} for this handle.
                      </td>
                    </tr>
                  )}
                  {summary.map((row: SummaryRow) => (
                    <React.Fragment key={row.division}>
                      <tr
                        style={{ cursor: "pointer" }}
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
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 6 }}>
                          <svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            style={{ transform: expandedDivisions[row.division] ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                            aria-hidden="true"
                          >
                            <polyline points="6,9 12,15 18,9" fill="none" stroke="currentColor" strokeWidth="2" />
                          </svg>
                          <span>{row.division}</span>
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{row.contests}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{row.avgAttempted != null ? row.avgAttempted.toFixed(2) : "—"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{row.avgSolved != null ? row.avgSolved.toFixed(2) : "—"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{row.avgRatingDelta != null ? signed(row.avgRatingDelta) : "—"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{row.avgRank != null ? row.avgRank.toFixed(0) : "—"}</td>
                      </tr>
                      {expandedDivisions[row.division] && (
                        <tr>
                            <td colSpan={6} style={{ padding: 8, background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
                            <div style={{ overflowX: "auto" }}>
                              <table className="standings" style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr style={{ color: "#374151" }}>
                                      <th style={{ textAlign: "left", padding: 6 }}>
                                        {viewMode === "percent"
                                          ? `Metric (Avg. of past ${k} ${byMode === "months" ? "month(s)" : "contest(s)"})`
                                          : `Metric (Past ${k} ${byMode === "months" ? "month(s)" : "contest(s)"})`}
                                      </th>
                                    {["A","B","C","D","E","F","G"].map((L) => (
                                      <th key={L} style={{ textAlign: "right", padding: 6 }}>{L}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {viewMode === "percent" ? (
                                    <>
                                      <tr>
                                        <td style={{ padding: 6, color: "#374151" }}>Attempt (%)</td>
                                        {["A","B","C","D","E","F","G"].map((L) => (
                                          <td key={L} style={{ padding: 6, textAlign: "right" }}>
                                            {letterByDivision[row.division]?.attemptPct?.[L] != null ? `${letterByDivision[row.division]!.attemptPct[L]!.toFixed(1)}%` : "—"}
                                          </td>
                                        ))}
                                      </tr>
                                      <tr>
                                        <td style={{ padding: 6, color: "#374151" }}>Acceptance (%)</td>
                                        {["A","B","C","D","E","F","G"].map((L) => (
                                          <td key={L} style={{ padding: 6, textAlign: "right" }}>
                                            {letterByDivision[row.division]?.acceptancePct?.[L] != null ? `${letterByDivision[row.division]!.acceptancePct[L]!.toFixed(1)}%` : "—"}
                                          </td>
                                        ))}
                                      </tr>
                                    </>
                                  ) : (
                                    <>
                                      <tr>
                                        <td style={{ padding: 6, color: "#374151" }}>Attempt count</td>
                                        {["A","B","C","D","E","F","G"].map((L) => (
                                          <td key={L} style={{ padding: 6, textAlign: "right" }}>
                                            {letterByDivision[row.division]?.attemptCount?.[L] ?? "—"}
                                          </td>
                                        ))}
                                      </tr>
                                      <tr>
                                        <td style={{ padding: 6, color: "#374151" }}>Acceptance count</td>
                                        {["A","B","C","D","E","F","G"].map((L) => (
                                          <td key={L} style={{ padding: 6, textAlign: "right" }}>
                                            {letterByDivision[row.division]?.acceptanceCount?.[L] ?? "—"}
                                          </td>
                                        ))}
                                      </tr>
                                      <tr>
                                        <td style={{ padding: 6, color: "#374151" }}>Avg time to solve</td>
                                        {["A","B","C","D","E","F","G"].map((L) => (
                                          <td key={L} style={{ padding: 6, textAlign: "right" }}>
                                            {letterByDivision[row.division]?.indivTimeAvgSec?.[L] != null ? formatTime(letterByDivision[row.division]!.indivTimeAvgSec[L]!) : "—"}
                                          </td>
                                        ))}
                                      </tr>
                                      <tr>
                                        <td style={{ padding: 6, color: "#374151" }}>Avg cumulative time</td>
                                        {["A","B","C","D","E","F","G"].map((L) => (
                                          <td key={L} style={{ padding: 6, textAlign: "right" }}>
                                            {letterByDivision[row.division]?.cumulTimeAvgSec?.[L] != null ? formatTime(letterByDivision[row.division]!.cumulTimeAvgSec[L]!) : "—"}
                                          </td>
                                        ))}
                                      </tr>
                                    </>
                                  )}
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
            <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
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
