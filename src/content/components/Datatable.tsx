import "./Datatable.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useState } from "react";

import type { Problem } from "./ProblemService.tsx";
import { ProblemService } from "./ProblemService.tsx";
const Header = (
  <div
    style={{
      padding: "4px 0 0 6px",
      fontSize: "1.4rem",
      position: "relative",
    }}
  >
    Problems
  </div>
);
const Datatable: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  useEffect(() => {
    // ProblemService.getProblemsMini().then((data: Problem[]) => {
    // 	setProblems(data);
    // }
    setProblems(ProblemService.getProblemsData());
  }, []);

  return (
    <DataTable
      value={problems}
      tableStyle={{ minWidth: "50rem" }}
      removableSort
      sortMode="multiple"
      className="datatable"
      header={Header}
      resizableColumns
      columnResizeMode="expand"
      showGridlines
      reorderableColumns
      stripedRows
      paginator
      rows={25}
      rowsPerPageOptions={[25, 50, 100]}
    >
      <Column
        sortable
        header="#"
        headerStyle={{ textAlign: "center" }}
        body={(rowData: Problem) => {
          // Safely convert to strings (useful if fetched data isn't clean)
          const contestId = String(rowData.contestId);
          const index = String(rowData.index).toUpperCase();

          // Build a safe URL – starts with hard‑coded scheme/host
          const href = `https://codeforces.com/contest/${encodeURIComponent(contestId)}/problem/${encodeURIComponent(index)}`;

          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
              }}
            >
              {contestId + index}
            </a>
          );
        }}
      />

      <Column
        header="Name"
        headerStyle={{ textAlign: "center" }}
        body={(row: Problem) => (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
            }}
          >
            <a
              href={`https://codeforces.com/contest/${row.contestId}/problem/${row.index}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flexShrink: 1,
                minWidth: 0,
                textAlign: "left",
              }}
              title={row.name}
            >
              {row.name}
            </a>
            <span
              style={{
                color: "#888",
                fontSize: "1.1rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flexShrink: 0,
                marginLeft: "auto",
              }}
              title={row.tags.join(", ")}
            >
              {row.tags.join(", ")}
            </span>
          </div>
        )}
      />
      <Column
        sortable
        header="Attempt %"
        headerStyle={{ textAlign: "center" }}
        body={(rowData: Problem) => {
          const { inContestAttempts, contestRegistrants } = rowData;
          if (!contestRegistrants) return "—"; // avoid division by zero
          const rate = (inContestAttempts / contestRegistrants) * 100;
          return `${rate.toFixed(1)}%`;
        }}
      />
      <Column
        sortable
        header="Acceptance %"
        headerStyle={{ textAlign: "center" }}
        body={(rowData: Problem) => {
          const { inContestAccepted, inContestAttempts } = rowData;
          if (!inContestAttempts) return "—"; // Avoid division by zero
          const rate = (inContestAccepted / inContestAttempts) * 100;
          return `${rate.toFixed(1)}%`;
        }}
      />
      <Column
        field="cfRating"
        sortable
        header="CF-Rating"
        headerStyle={{ textAlign: "center" }}
      />
      <Column
        field="clistRating"
        sortable
        header="Clist-Rating"
        headerStyle={{ textAlign: "center" }}
      />
      <Column
        field="totalAccepted"
        sortable
        header="Solved"
        headerStyle={{ textAlign: "center" }}
      />
    </DataTable>
  );
};

export default Datatable;
