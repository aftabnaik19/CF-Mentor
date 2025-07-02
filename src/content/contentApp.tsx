import React from "react";
import ReactDOM from "react-dom/client";

import BookmarkPanel from "./components/BookmarkPanel";

export function mountApp(root: HTMLElement) {
	const rootContainer = ReactDOM.createRoot(root);
	rootContainer.render(
		<React.StrictMode>
			<BookmarkPanel />
		</React.StrictMode>,
	);
}
