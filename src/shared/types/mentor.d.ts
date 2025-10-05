export interface Problem {
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

export interface Contest {
	id: number;
	name: string;
	rules: string;
	type: string;
	duration_seconds: number;
	start_time: string;
}

export interface Sheet {
	id: number;
	name: string;
}

export interface SheetProblem {
	sheet_id: number;
	contest_id: number;
	index: string;
}

export interface MentorData {
	problems: Problem[];
	contests: Contest[];
	sheets: Sheet[];
	sheets_problems: SheetProblem[];
}