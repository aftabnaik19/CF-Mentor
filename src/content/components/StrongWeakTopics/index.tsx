
import { styles } from "./styles";
import { useStrongWeakAnalysis } from "./useStrongWeakAnalysis";

interface StrongWeakTopicsProps {
  handle: string | null;
}

export default function StrongWeakTopics({ handle }: StrongWeakTopicsProps) {
  const { loading, error, strongTopics, weakTopics, userRating } = useStrongWeakAnalysis(handle);

  if (!handle) return null;

  return (
    <div style={{ ...styles.container, marginTop: "20px", borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
      <h4 style={styles.title}>Strong vs Weak Topics (Beta)</h4>
      
      {loading && <div style={styles.loading}>Analyzing contest history...</div>}
      {error && <div style={styles.error}>{error}</div>}
      
      {!loading && !error && userRating && (
        <div style={{ display: "flex", gap: "20px", flexDirection: "row" }}>
          {/* Strong Topics Table */}
          <div style={{ flex: 1 }}>
            <h5 style={{ ...styles.title, ...styles.strongHeader, fontSize: "14px", borderBottom: "1px solid #eee", paddingBottom: "5px" }}>
              Strong Topics
            </h5>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Topic</th>
                  <th style={styles.th}>Avg Rating</th>
                  <th style={styles.th}>Your Rating</th>
                  <th style={styles.th}>Diff</th>
                </tr>
              </thead>
              <tbody>
                {strongTopics.map((topic) => (
                  <tr key={topic.tag}>
                    <td style={{ ...styles.td, ...styles.tagCell }}>{topic.tag}</td>
                    <td style={{ ...styles.td, ...styles.ratingCell }}>{Math.round(topic.idealRating)}</td>
                    <td style={{ ...styles.td, ...styles.ratingCell }}>{Math.round(topic.actualRating)}</td>
                    <td style={{ ...styles.td, ...styles.ratingCell, ...styles.diffPositive }}>
                      +{Math.round(topic.diff)}
                    </td>
                  </tr>
                ))}
                {strongTopics.length === 0 && (
                  <tr><td colSpan={4} style={styles.td}>Not enough data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Weak Topics Table */}
          <div style={{ flex: 1 }}>
            <h5 style={{ ...styles.title, ...styles.weakHeader, fontSize: "14px", borderBottom: "1px solid #eee", paddingBottom: "5px" }}>
              Weak Topics
            </h5>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Topic</th>
                  <th style={styles.th}>Avg Rating</th>
                  <th style={styles.th}>Your Rating</th>
                  <th style={styles.th}>Diff</th>
                </tr>
              </thead>
              <tbody>
                {weakTopics.map((topic) => (
                  <tr key={topic.tag}>
                    <td style={{ ...styles.td, ...styles.tagCell }}>{topic.tag}</td>
                    <td style={{ ...styles.td, ...styles.ratingCell }}>{Math.round(topic.idealRating)}</td>
                    <td style={{ ...styles.td, ...styles.ratingCell }}>{Math.round(topic.actualRating)}</td>
                    <td style={{ ...styles.td, ...styles.ratingCell, ...styles.diffNegative }}>
                      {Math.round(topic.diff)}
                    </td>
                  </tr>
                ))}
                {weakTopics.length === 0 && (
                  <tr><td colSpan={4} style={styles.td}>Not enough data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div style={{ fontSize: "11px", color: "#777", marginTop: "10px" }}>
        * Based on your solved problems vs ideal rating for your band ({Math.floor((userRating || 0) / 100) * 100}).
        <br/>
        * Requires at least 5 solved problems per tag to appear.
      </div>
    </div>
  );
}
