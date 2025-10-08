export interface ProblemFilter {
  cfRating?: {
    min?: number;
    max?: number;
  };
  clistRating?: {
    min?: number;
    max?: number;
  };
  tags?: {
    values: string[];
    mode: "and" | "or";
  };
  sheets?: {
    values: string[];
    mode: "and" | "or";
  };
  contestType?: {
    values: string[];
    mode: "and" | "or";
  };
  totalSubmissions?: {
    gte?: number;
    lte?: number;
  };
  acceptanceRate?: {
    gte?: number;
    lte?: number;
  };
  attemptRate?: {
    gte?: number;
    lte?: number;
  };
  problemDate?: {
    after?: string; // ISO date or year
    before?: string; // ISO date or year
  };
  problemIndex?: {
    values: string[];
  };
  contestId?: {
    gte?: number;
    lte?: number;
  };
}
