import { PrimeReactProvider } from "primereact/api";
import React from "react";
import ReactDOM from "react-dom/client";
// Augment the global Window interface so TypeScript recognizes our custom property
declare global {
	interface Window {
		__cfMentorRoots?: WeakMap<HTMLElement, ReactDOM.Root>;
	}
}

// Ensure a single shared WeakMap lives on `window` across module loads
if (!window.__cfMentorRoots) {
	window.__cfMentorRoots = new WeakMap<HTMLElement, ReactDOM.Root>();
}

// Assert that roots is defined exactly once here
const roots = window.__cfMentorRoots as WeakMap<HTMLElement, ReactDOM.Root>;

/**
 * Generic mount function for React components.
 * @param target - HTMLElement to mount the app inside
 * @param Component - React component to render
 */
export function mountComponent(
	target: HTMLElement,
	Component: React.ReactElement,
) {
	const root = ReactDOM.createRoot(target);
	roots.set(target, root);
	root.render(
		<React.StrictMode>
			<PrimeReactProvider value={{ ripple: true, inputStyle: "outlined" }}>
				{Component}
			</PrimeReactProvider>
		</React.StrictMode>,
	);
}

/**
 * Generic unmount function for React components.
 * @param target - The same HTMLElement used to mount
 */
export function unmountComponent(target: HTMLElement) {
	const root = roots.get(target);
	if (root) {
		root.unmount();
		roots.delete(target);
	}
}
