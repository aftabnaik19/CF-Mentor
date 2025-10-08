import "./Datatable.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useRef,useState } from "react";

import { useFilterStore } from "../../../shared/stores/filter-store.ts";
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

const Datatable: React.FC = () => {
	const [problems, setProblems] = useState<Problem[]>([]);
	const [loading, setLoading] = useState(true);

	// Use a ref to hold the port to prevent re-connections on re-renders
	const portRef = useRef<chrome.runtime.Port | null>(null);
	const isFetchingRef = useRef(false);

	useEffect(() => {
		const fetchData = () => {
			if (!portRef.current || isFetchingRef.current) return;

			isFetchingRef.current = true;
			setLoading(true);
			// Read the latest filters directly from the store when fetching
			const currentFilters = useFilterStore.getState().filters;
			ProblemService.getProblems(portRef.current, currentFilters).then(
				(data) => {
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
					isFetchingRef.current = false;
				},
			);
		};

		portRef.current = ProblemService.listenToState((state) => {
			console.log("Received state from background:", state);
			switch (state) {
				case "READY":
					fetchData();
					break;
				case "FETCHING":
					setLoading(true);
					break;
				case "ERROR":
					setLoading(false);
					break;
			}
		});

		// Re-fetch data when filters change, but only if the state is READY.
		const unsubscribe = useFilterStore.subscribe((state, prevState) => {
			if (
				portRef.current &&
				JSON.stringify(state.filters) !== JSON.stringify(prevState.filters)
			) {
				console.log("Filters changed, re-fetching data.");
				fetchData();
			}
		});

		const port = portRef.current;
		return () => {
			unsubscribe();
			port?.disconnect();
		};
	}, []); // Run only once on mount

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

export default Datatable;
