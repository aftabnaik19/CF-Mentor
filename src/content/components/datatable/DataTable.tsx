import "./DataTable.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useRef,useState } from "react";

import { useConnectionStore } from "../../../shared/stores/connectionStore.ts";
import { useFilterStore } from "../../../shared/stores/filterStore.ts";
import type { Problem } from "./problemService.ts";
import { ProblemService } from "./problemService.ts";

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

const ProblemDataTable: React.FC = () => {
	const [problems, setProblems] = useState<Problem[]>([]);
	const [loading, setLoading] = useState(true);
	const filters = useFilterStore((state) => state.filters);
	const isConnected = useConnectionStore((state) => state.isConnected);
	const alertShownRef = useRef(false);

	// Effect to show an alert when the extension is disconnected.
	useEffect(() => {
		if (!isConnected && !alertShownRef.current) {
			alert("CF-Mentor extension has been updated, please reload the page");
			alertShownRef.current = true;
		}
	}, [isConnected]);

	useEffect(() => {
		// Don't fetch if the extension context is invalidated
		if (!isConnected) {
			setLoading(false);
			return;
		}

		const controller = new AbortController();
		setLoading(true);

		ProblemService.fetchAndFilterProblems(filters, (state) => {
			if (state === "FETCHING") {
				setLoading(true);
			} else if (state === "ERROR") {
				setLoading(false);
			}
		})
			.then((data) => {
				if (controller.signal.aborted) return;
				console.log("Received data from service worker:", data);
				const processedProblems = data.problems.map((p) => ({
					...p,
					sortableId: `${p.contestId.toString().padStart(5, "0")}${p.index}`,
					attemptPercentage: p.totalUsers
						? (p.attemptCount / p.totalUsers) * 100
						: 0,
					acceptancePercentage: p.attemptCount
						? (p.acceptedCount / p.attemptCount) * 100
						: 0,
				}));
				setProblems(processedProblems);
				setLoading(false);
			})
			.catch((error) => {
				if (controller.signal.aborted) return;
				console.error("Failed to fetch problems:", error);
				setLoading(false);
			});

		return () => {
			controller.abort();
		};
	}, [filters, isConnected]); // Re-run this effect whenever filters or connection state change

	return (
		<DataTable
			value={problems}
			loading={loading}
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
				sortField="sortableId"
				header="#"
				headerStyle={{ textAlign: "center" }}
				body={(rowData: Problem) => {
					// Safely convert to strings (useful if fetched data isn't clean)
					const contestId = String(rowData.contestId);
					const index = String(rowData.index).toUpperCase();

					// Build a safe URL – starts with hard‑coded scheme/host
					const href = `https://codeforces.com/contest/${encodeURIComponent(
						contestId,
					)}/problem/${encodeURIComponent(index)}`;

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
				field="attemptPercentage"
				header="Attempt %"
				headerStyle={{ textAlign: "center" }}
				body={(rowData: Problem) => `${rowData.attemptPercentage?.toFixed(1)}%`}
			/>
			<Column
				sortable
				field="acceptancePercentage"
				header="Acceptance %"
				headerStyle={{ textAlign: "center" }}
				body={(rowData: Problem) =>
					`${rowData.acceptancePercentage?.toFixed(1)}%`
				}
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
				field="tillDateAccepted"
				sortable
				header="Solved"
				headerStyle={{ textAlign: "center" }}
			/>
		</DataTable>
	);
};

export default ProblemDataTable;
