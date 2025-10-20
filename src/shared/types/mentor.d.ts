export interface Problem {
	contestId: number;
	index: string;
	name: string;
	cfRating: number;
	clistRating: number;
	tags: string[];
	acceptedCount: number;
	attemptCount: number;
	totalUsers: number;
	tillDateAccepted: number;
	problemDate: string;
}

export interface Contest {
	id: number;
	name: string;
	rules: string;
	type: string;
	durationSeconds: number;
	startTime: string;
}

export interface Sheet {
	id: number;
	name: string;
}

export interface SheetProblem {
	sheetId: number;
	contestId: number;
	index: string;
}

export interface MentorData {
	problems: Problem[];
	contests: Contest[];
	sheets: Sheet[];
	sheetsProblems: SheetProblem[];
	contestTypes?: string[];
	tags?: string[];
}
