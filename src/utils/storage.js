// monthKey: "2025-01" format
export const monthKey = (m, y) => `${y}-${String(m + 1).padStart(2, "0")}`;
