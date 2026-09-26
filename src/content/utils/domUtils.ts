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
