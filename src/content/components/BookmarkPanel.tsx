import { useState } from "react";

import DifficultySelector from "./DifficultySelector";
import Notes from "./Notes";
import Stopwatch from "./Stopwatch";

const BookmarkPanel: React.FC = () => {
	const [difficulty, setDifficulty] = useState(0);
	const [showDropdown, setShowDropdown] = useState(false);
	const [bookmarked, setBookmarked] = useState(false);

	return (
		<div className="roundbox sidebox borderTopRound" style={{ padding: "0" }}>
			<table className="rtable" style={{ width: "100%", margin: "0" }}>
				<tbody>
					<tr>
						<th className="left" style={{ padding: "0.5em" }}>
							<a href="https://www.youtube.com/" style={{ color: "black" }}>
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
								<div style={{ flex: 1 }}></div>
								<span
									role="button"
									tabIndex={0}
									className="contest-state-phase"
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.4em",
										cursor: "pointer",
										whiteSpace: "nowrap",
									}}
									onClick={() => setBookmarked(!bookmarked)}
								>
									Bookmark Question
									<img
										alt="Bookmark icon"
										src={`//codeforces.org/s/46398/images/icons/star_${bookmarked ? "yellow" : "gray"}_24.png`}
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
									onClick={() => setShowDropdown(!showDropdown)}
								>
									{showDropdown ? "▲" : "▼"}
								</span>
							</div>
						</td>
					</tr>
					{showDropdown && (
						<>
							<tr>
								<td className="left" style={{ padding: "0 1em 0 1em" }}>
									<DifficultySelector
										difficulty={difficulty}
										onChange={setDifficulty}
										onReset={() => setDifficulty(0)}
									/>
								</td>
							</tr>
							<tr>
								<td className="left" style={{ padding: "0 1em 1em 1em" }}>
									<Notes />
								</td>
							</tr>
						</>
					)}
					<tr>
						<td className="left" style={{ padding: "0.5em 1em" }}>
							<Stopwatch />
						</td>
					</tr>
					<tr>
						<td className="left dark" style={{ padding: "0.5em 1em" }}>
							<span className="contest-state-regular">Time is running..!</span>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
};

export default BookmarkPanel;
