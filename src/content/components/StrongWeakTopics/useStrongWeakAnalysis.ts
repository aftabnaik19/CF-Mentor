import { useEffect, useState } from "react";

interface UserInfo {
  rating?: number;
  [key: string]: any;
}

interface Submission {
  id: number;
  verdict: string;
  problem: {
    contestId: number;
    index: string;
    rating?: number;
    tags: string[];
  };
}

// --- Hardcoded Reference Matrix ---
// Row: Tag, Column: Rating Band (lower bound)
// Value: Ideal Average Rating for that tag in that band
// Bands: 800, 900, ..., 3000
const BANDS = Array.from({ length: 23 }, (_, i) => 800 + i * 100); // 800 to 3000
const TAGS = [
  "math", "greedy", "dp", "data structures", "constructive algorithms",
  "brute force", "graphs", "sortings", "binary search", "dfs and similar",
  "trees", "strings", "number theory", "combinatorics", "geometry",
  "bitmasks", "two pointers", "dsu", "shortest paths", "probabilities",
  "divide and conquer", "hashing", "games", "flows", "interactive",
  "matrices", "fft", "ternary search", "expression parsing", "meet-in-the-middle",
  "2-sat", "chinese remainder theorem", "schedules"
];

// Generate sensible dummy data for now
// Logic: Ideal rating ~ Band + Tag Complexity Offset
const TAG_OFFSETS: Record<string, number> = {
  "math": 50, "greedy": 0, "dp": 100, "data structures": 80,
  "constructive algorithms": 20, "brute force": -50, "graphs": 90,
  "binary search": 40, "geometry": 150, "number theory": 120
};

const REFERENCE_MATRIX: Record<string, Record<number, number>> = {};

TAGS.forEach(tag => {
  REFERENCE_MATRIX[tag] = {};
  BANDS.forEach(band => {
    const offset = TAG_OFFSETS[tag] || 50; // Default offset
    // Ideal rating increases with band, capped reasonably
    REFERENCE_MATRIX[tag][band] = band + offset; 
  });
});

interface TopicAnalysis {
  tag: string;
  actualRating: number;
  idealRating: number;
  diff: number; // Actual - Ideal
  problemCount: number;
}

export function useStrongWeakAnalysis(handle: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strongTopics, setStrongTopics] = useState<TopicAnalysis[]>([]);
  const [weakTopics, setWeakTopics] = useState<TopicAnalysis[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    if (!handle) return;

    const analyze = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch User Info to get current rating
        const userRes = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
        const userData = await userRes.json();
        if (userData.status !== "OK") throw new Error("Failed to fetch user info");
        const userInfo = userData.result[0] as UserInfo;
        const rating = userInfo.rating || 0;
        setUserRating(rating);

        // Determine Rating Band (round down to nearest 100)
        const band = Math.floor(rating / 100) * 100;
        const effectiveBand = Math.max(800, Math.min(3000, band));

        // 2. Fetch Submissions
        const subsRes = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
        const subsData = await subsRes.json();
        if (subsData.status !== "OK") throw new Error("Failed to fetch submissions");
        
        const submissions = subsData.result as Submission[];

        // 3. Calculate Actual Ratings per Tag
        // Filter: Solved problems (OK), distinct problems
        const solvedProblems = new Map<string, number>(); // problemId -> rating
        const tagRatings: Record<string, number[]> = {};

        submissions.forEach(sub => {
          if (sub.verdict === "OK" && sub.problem.rating) {
            const id = `${sub.problem.contestId}-${sub.problem.index}`;
            if (!solvedProblems.has(id)) {
              solvedProblems.set(id, sub.problem.rating);
              sub.problem.tags.forEach((tag: string) => {
                if (!tagRatings[tag]) tagRatings[tag] = [];
                tagRatings[tag].push(sub.problem.rating!);
              });
            }
          }
        });

        const analysis: TopicAnalysis[] = [];

        Object.entries(tagRatings).forEach(([tag, ratings]) => {
          if (ratings.length < 5) return; // Ignore tags with few problems

          // Sort descending to get highest rated problems
          ratings.sort((a, b) => b - a);
          
          // Take top 15 (or fewer if not enough)
          const topRatings = ratings.slice(0, 15);
          
          const sum = topRatings.reduce((a, b) => a + b, 0);
          const actualAvg = sum / topRatings.length;
          
          // Get Ideal Rating from Matrix
          const ideal = REFERENCE_MATRIX[tag]?.[effectiveBand] || (effectiveBand + 50);

          analysis.push({
            tag,
            actualRating: actualAvg,
            idealRating: ideal,
            diff: actualAvg - ideal,
            problemCount: ratings.length
          });
        });

        // Sort by Diff
        analysis.sort((a, b) => b.diff - a.diff);

        setStrongTopics(analysis.slice(0, 5)); // Top 5 Positive Diff
        setWeakTopics(analysis.slice(-5).reverse()); // Top 5 Negative Diff (most negative first)

      } catch (err) {
        console.error(err);
        setError("Failed to analyze profile.");
      } finally {
        setLoading(false);
      }
    };

    analyze();
  }, [handle]);

  return { loading, error, strongTopics, weakTopics, userRating };
}
