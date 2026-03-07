import { STORAGE_KEY } from "./constants";

// monthKey: "2025-01" format
export const monthKey = (m, y) => `${y}-${String(m + 1).padStart(2, "0")}`;

export function load() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

export function persist(d) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch { /* ignore quota errors */ }
}
