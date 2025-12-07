/**
 * This file contains utility functions for interacting with the Codeforces DOM.
 */

// Get the current Codeforces user handle from the page header
export const getCurrentUserHandle = (): string | null => {
	const profileLink = document.querySelector(
		"#header a[href^='/profile/']",
	) as HTMLAnchorElement;
	return profileLink?.innerText ?? null;
};

// Get current problem info from URL and DOM
export const getCurrentProblemInfo = (): {
	contestId: string;
	problemIdx: string;
} | null => {
	const url = window.location.href;
	const match =
		url.match(/\/contest\/(\d+)\/problem\/([A-Z]\d*)/i) ||
		url.match(/\/problemset\/problem\/(\d+)\/([A-Z]\d*)/i);

	if (match) {
		return {
			contestId: match[1],
			problemIdx: match[2].toUpperCase(),
		};
	}
	return null;
};

// Extract problem rating from tags
export const extractProblemRating = (): string | null => {
	const tagElements = document.querySelectorAll(".tag-box");
	for (const tag of Array.from(tagElements)) {
		const text = tag.textContent?.trim();
		if (text && text.match(/^\*\d+$/)) {
			return text;
		}
	}
	return null;
};

// Extract problem tags
export const extractProblemTags = (): string[] => {
	const tagElements = document.querySelectorAll(".tag-box");
	const tags: string[] = [];

	for (const tag of Array.from(tagElements)) {
		const text = tag.textContent?.trim();
		if (text && !text.match(/^\*\d+$/)) {
			// Exclude rating tags
			tags.push(text);
		}
	}
	return tags;
};
// Get problem name from the page
export const getProblemName = (): string | null => {
	const titleElement = document.querySelector(".problem-statement .title");
	if (titleElement) {
		// Title format is usually "A. Problem Name"
		return titleElement.textContent?.trim() ?? null;
	}
	return null;
};

// Inject an item into the "Contest materials" sidebar box
export const injectContestMaterialItem = (html: string, id: string) => {
	// Find the "Contest materials" box
	// It usually has class "roundbox sidebox sidebar-menu" and contains "Contest materials" caption
	const sideboxes = document.querySelectorAll(".roundbox.sidebox.sidebar-menu");
	let targetBox: Element | null = null;

	for (const box of Array.from(sideboxes)) {
		const caption = box.querySelector(".caption");
		if (caption && caption.textContent?.includes("Contest materials")) {
			targetBox = box;
			break;
		}
	}

	if (!targetBox) return;

	// Check if item already exists
	if (document.getElementById(id)) return;

	// Find the UL
	const ul = targetBox.querySelector("ul");
	if (ul) {
		const li = document.createElement("li");
		li.id = id;
		li.innerHTML = html;
		ul.appendChild(li);
	}
};
