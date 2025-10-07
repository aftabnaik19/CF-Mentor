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
}

// --- Raw API Types (snake_case) ---

export interface RawProblem {
	contest_id: number;
	index: string;
	name: string;
	cf_rating: number;
	clist_rating: number;
	tags: string[];
	accepted_count: number;
	attempt_count: number;
	total_users: number;
	till_date_accepted: number;
	problem_date: string;
}

export interface RawContest {
	id: number;
	name: string;
	rules: string;
	type: string;
	duration_seconds: number;
	start_time: string;
}

export interface RawSheetProblem {
	sheet_id: number;
	contest_id: number;
	index: string;
}

export interface RawMentorData {
	problems: RawProblem[];
	contests: RawContest[];
	sheets: Sheet[]; // Sheets already use camelCase keys
	sheets_problems: RawSheetProblem[];
}
