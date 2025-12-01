export const styles = {
  container: {
    fontFamily: "verdana, arial, sans-serif",
    fontSize: "13px",
  },
  title: {
    marginBottom: "1em",
    fontSize: "15px",
    color: "#3b5998",
    fontWeight: "bold",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginBottom: "1em",
  },
  th: {
    textAlign: "left" as const,
    padding: "4px",
    borderBottom: "1px solid #e1e1e1",
    backgroundColor: "#f8f8f8",
    color: "#555",
    fontWeight: "bold",
  },
  td: {
    padding: "4px",
    borderBottom: "1px solid #e1e1e1",
  },
  strongHeader: {
    color: "green",
  },
  weakHeader: {
    color: "#d32f2f",
  },
  tagCell: {
    fontWeight: "bold",
  },
  ratingCell: {
    textAlign: "center" as const,
  },
  diffPositive: {
    color: "green",
    fontWeight: "bold",
  },
  diffNegative: {
    color: "#d32f2f",
    fontWeight: "bold",
  },
  loading: {
    color: "#666",
    fontStyle: "italic",
    padding: "10px",
  },
  error: {
    color: "#d32f2f",
    padding: "10px",
  },
};
