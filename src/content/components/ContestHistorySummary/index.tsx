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
  const [filterDivision, setFilterDivision] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const { loading, error, summary, unknownMetaCount, contestsConsidered, details, letterByDivision } = useContestSummary({ handle, k });
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // no-op; hook reacts to handle/k
  }, [handle, k]);

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>Contest History Summary</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label htmlFor="kInput" style={{ fontSize: 12, color: "#374151" }}>Past contests:</label>
          <input
            id="kInput"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            placeholder="10"
            value={kInput}
            onChange={(e) => {
              const val = e.target.value;
              setKInput(val);
            }}
            onBlur={() => {
              const n = parseInt(kInput, 10);
              const valid = Number.isFinite(n) && n >= 1;
              const next = valid ? n : 10;
              setK(next);
              setKInput(String(next));
            }}
            style={{ ...controlInputStyle, width: 72 }}
          />
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
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", color: "#374151" }}>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #f3f4f6" }}>Division</th>
                    <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #f3f4f6" }}>Contests</th>
                    <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #f3f4f6" }}>Attempt rate</th>
                    <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #f3f4f6" }}>Acceptance rate</th>
                    <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #f3f4f6" }}>Avg attempted</th>
                    <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #f3f4f6" }}>Avg solved</th>
                    <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #f3f4f6" }}>Avg rating Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 12, textAlign: "center", color: "#6b7280" }}>
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
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                          {row.attemptRatePct != null ? `${row.attemptRatePct.toFixed(1)}%` : "—"}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                          {row.acceptanceRatePct != null ? `${row.acceptanceRatePct.toFixed(1)}%` : "—"}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{row.avgAttempted != null ? row.avgAttempted.toFixed(2) : "—"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{row.avgSolved != null ? row.avgSolved.toFixed(2) : "—"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{row.avgRatingDelta != null ? signed(row.avgRatingDelta) : "—"}</td>
                      </tr>
                      {expandedDivisions[row.division] && (
                        <tr>
                          <td colSpan={7} style={{ padding: 8, background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr style={{ color: "#374151" }}>
                                    <th style={{ textAlign: "left", padding: 6 }}>Metric</th>
                                    {["A","B","C","D","E","F"].map((L) => (
                                      <th key={L} style={{ textAlign: "right", padding: 6 }}>{L}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: 6, color: "#374151" }}>Attempt (%)</td>
                                    {["A","B","C","D","E","F"].map((L) => (
                                      <td key={L} style={{ padding: 6, textAlign: "right" }}>
                                        {letterByDivision[row.division]?.attemptPct?.[L] != null ? `${letterByDivision[row.division]!.attemptPct[L]!.toFixed(1)}%` : "—"}
                                      </td>
                                    ))}
                                  </tr>
                                  <tr>
                                    <td style={{ padding: 6, color: "#374151" }}>Acceptance (%)</td>
                                    {["A","B","C","D","E","F"].map((L) => (
                                      <td key={L} style={{ padding: 6, textAlign: "right" }}>
                                        {letterByDivision[row.division]?.acceptancePct?.[L] != null ? `${letterByDivision[row.division]!.acceptancePct[L]!.toFixed(1)}%` : "—"}
                                      </td>
                                    ))}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280", display: "flex", gap: 8, alignItems: "center" }}>
                              <button onClick={(e) => { e.stopPropagation(); setFilterDivision(row.division); }} style={{ ...chipStyle }}>Filter chips to this division</button>
                              {filterDivision === row.division && (
                                <button onClick={(e) => { e.stopPropagation(); setFilterDivision(null); }} style={{ ...chipStyle }}>Clear</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <button
                  onClick={() => setDetailsOpen((v) => !v)}
                  aria-expanded={detailsOpen}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    color: "#374151",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>Considered contests</span>
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    style={{ transform: detailsOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                    aria-hidden="true"
                  >
                    <polyline points="6,9 12,15 18,9" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span style={{ color: "#6b7280", fontWeight: 400 }}>({contestsConsidered})</span>
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {filterDivision && (
                    <span style={{ ...chipStyle, ...chipActive }}>Filter: {filterDivision}</span>
                  )}
                  {filterDivision && (
                    <button onClick={() => setFilterDivision(null)} style={{ ...chipStyle }}>Clear</button>
                  )}
                </div>
              </div>
              {detailsOpen && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {details
                    .filter((d) => !filterDivision || d.division === filterDivision)
                    .map((d) => (
                      <a
                        key={d.id}
                        href={`https://codeforces.com/contest/${d.id}/standings`}
                        target="_blank"
                        rel="noreferrer"
                        title={d.name}
                        style={{ ...chipStyle, textDecoration: "none" }}
                      >
                        {shortenName(d.name)}
                      </a>
                    ))}
                </div>
              )}
              <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
                Tip: click a division row to see A–F attempt and acceptance breakdown; use Filter to narrow the chips below.
              </div>
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

function shortenName(name: string): string {
  // Prefer keeping division info visible; trim common prefixes
  let n = name.replace(/^Codeforces\s+/i, "CF ");
  if (n.length > 28) n = n.slice(0, 25) + "…";
  return n;
}
