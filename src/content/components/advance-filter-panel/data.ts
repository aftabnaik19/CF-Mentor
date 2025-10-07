export const ALGORITHM_TAGS = [
	{ value: "2-sat", label: "2-SAT", description: "2-satisfiability" },
	{
		value: "binary-search",
		label: "Binary Search",
		description: "Binary search algorithms",
	},
	{
		value: "bitmasks",
		label: "Bitmasks",
		description: "Bitwise operations and masks",
	},
	{
		value: "brute-force",
		label: "Brute Force",
		description: "Exhaustive search",
	},
	{
		value: "chinese-remainder",
		label: "Chinese Remainder Theorem",
		description: "Number theory",
	},
	{
		value: "combinatorics",
		label: "Combinatorics",
		description: "Counting and arrangements",
	},
	{
		value: "constructive",
		label: "Constructive Algorithms",
		description: "Constructive",
	},
	{
		value: "data-structures",
		label: "Data Structures",
		description: "Heaps, binary search trees, segment trees, hash tables, etc",
	},
	{ value: "dfs", label: "DFS and Similar", description: "Dfs and similar" },
	{
		value: "divide-conquer",
		label: "Divide and Conquer",
		description: "Divide and Conquer",
	},
	{
		value: "dp",
		label: "Dynamic Programming",
		description: "Dynamic programming",
	},
	{
		value: "dsu",
		label: "Disjoint Set Union",
		description: "Disjoint set union",
	},
	{
		value: "expression-parsing",
		label: "Expression Parsing",
		description: "Parsing expression grammar",
	},
	{ value: "fft", label: "FFT", description: "Fast Fourier transform" },
	{
		value: "flows",
		label: "Network Flows",
		description: "Graph network flows",
	},
	{
		value: "games",
		label: "Game Theory",
		description: "Games, Sprague–Grundy theorem",
	},
	{
		value: "geometry",
		label: "Geometry",
		description: "Geometry, computational geometry",
	},
	{
		value: "graph-matchings",
		label: "Graph Matchings",
		description:
			"Graph matchings, König's theorem, vertex cover of bipartite graph",
	},
	{ value: "graphs", label: "Graph Theory", description: "Graphs" },
	{ value: "greedy", label: "Greedy", description: "Greedy algorithms" },
	{ value: "hashing", label: "Hashing", description: "Hashing, hashtables" },
	{
		value: "implementation",
		label: "Implementation",
		description: "Implementation problems, programming technics, simulation",
	},
	{
		value: "interactive",
		label: "Interactive",
		description: "Interactive problem",
	},
	{
		value: "math",
		label: "Mathematics",
		description:
			"Mathematics including integration, differential equations, etc",
	},
	{
		value: "matrices",
		label: "Matrices",
		description:
			"Matrix multiplication, determinant, Cramer's rule, systems of linear equations",
	},
	{
		value: "meet-in-the-middle",
		label: "Meet-in-the-middle",
		description: "Meet-in-the-middle",
	},
	{
		value: "number-theory",
		label: "Number Theory",
		description: "Number theory: Euler function, GCD, divisibility, etc",
	},
	{
		value: "probabilities",
		label: "Probabilities",
		description:
			"Probabilities, expected values, statistics, random variables, etc",
	},
	{
		value: "schedules",
		label: "Schedules",
		description: "Scheduling Algorithms",
	},
	{
		value: "shortest-paths",
		label: "Shortest Paths",
		description: "Shortest paths on weighted and unweighted graphs",
	},
	{ value: "sortings", label: "Sorting", description: "Sortings, orderings" },
	{
		value: "string-suffix-structures",
		label: "String Suffix Structures",
		description: "Suffix arrays, suffix trees, suffix automatas, etc",
	},
	{
		value: "strings",
		label: "String Algorithms",
		description:
			"Prefix- and Z-functions, suffix structures, Knuth–Morris–Pratt algorithm, etc",
	},
	{
		value: "ternary-search",
		label: "Ternary Search",
		description: "Ternary search",
	},
	{ value: "trees", label: "Trees", description: "Trees" },
	{ value: "two-pointers", label: "Two Pointers", description: "Two pointers" },
];

export const PROBLEM_SHEETS = [
	{
		value: "cp31",
		label: "CP-31",
		description: "31-day competitive programming sheet",
	},
	{
		value: "acd-ladder",
		label: "Mostafa Saad Sheet 2",
		description: "Advance Sheet for Div. 2 D's and above",
	},
	{
		value: "c2-ladder",
		label: "C2 Ladder",
		description: "Advanced problem set",
	},
	{
		value: "a2oj",
		label: "A2OJ Ladder",
		description: "Classic competitive programming ladder",
	},
	{
		value: "mostafa-saad-2",
		label: "Mostafa Saad Sheet 1",
		description: "Beginner Level below Div. 2 D's",
	},
	{
		value: "mostafa-saad-1",
		label: "Mostafa Saad Sheet 2",
		description: "Advance Sheet for Div. 2 D's and above",
	},
];

export const CONTEST_TYPES = [
	{ value: "div1", label: "Div. 1", description: "Division 1 contests" },
	{ value: "div2", label: "Div. 2", description: "Division 2 contests" },
	{ value: "div3", label: "Div. 3", description: "Division 3 contests" },
	{ value: "div4", label: "Div. 4", description: "Division 4 contests" },
	{
		value: "div1+div2",
		label: "Div. 1 + Div. 2",
		description: "Div. 1 + Div. 2 Contests",
	},
	{
		value: "educational",
		label: "Educational",
		description: "Educational rounds",
	},
	{ value: "CodeTon", label: "CodeTon", description: "CodeTon Contests" },
	{ value: "global", label: "Global Round", description: "Global rounds" },
	{
		value: "kotlin",
		label: "Kotlin Heroes",
		description: "Kotlin programming contests",
	},
	{ value: "vk-cup", label: "VK Cup", description: "VK Cup contests" },
	{
		value: "long-rounds",
		label: "Long Rounds",
		description: "Duartion >= 1 day",
	},
	// { value: "goodbye", label: "Goodbye", description: "Year-end contests" },
	// { value: "hello", label: "Hello", description: "Year-start contests" },
	{
		value: "april-fools",
		label: "April Fools",
		description: "April Fools contests",
	},
	{
		value: "team-contests",
		label: "Team Contests",
		description: "Team Contests",
	},
	{
		value: "icpc-scoring",
		label: "ICPC Scoring",
		description: "ICPC Rules",
	},
];

export const PROBLEM_INDICES = [
	{ value: "A", label: "A" },
	{ value: "B", label: "B" },
	{ value: "C", label: "C" },
	{ value: "D", label: "D" },
	{ value: "E", label: "E" },
	{ value: "F", label: "F" },
	{ value: "G", label: "G" },
	{ value: "H", label: "H" },
	{ value: "I", label: "I" },
	{ value: "J", label: "J" },
];
