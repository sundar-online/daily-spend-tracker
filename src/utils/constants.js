// ── Constants ────────────────────────────────────────────────────────────────

export const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export const TODAY = new Date();
export const CURRENT_MONTH = TODAY.getMonth();
export const CURRENT_YEAR = TODAY.getFullYear();

export const DEFAULT_CATS = {
    Food: { icon: "🍽️", color: "#f97316", subs: ["Biryani", "Egg", "Snacks", "Groceries", "Coffee"] },
    Travel: { icon: "🚗", color: "#06b6d4", subs: ["College", "Bike", "Bus", "Fuel", "Cab"] },
    Bills: { icon: "📋", color: "#8b5cf6", subs: ["Rent", "Mobile Recharge", "Electricity", "Internet", "Water"] },
    Shopping: { icon: "🛍️", color: "#ec4899", subs: ["Clothes", "Electronics", "Books", "Accessories"] },
    Health: { icon: "💊", color: "#10b981", subs: ["Medicine", "Doctor", "Gym"] },
};

export const STORAGE_KEY = "smart_expense_v2";
export const SESSION_KEY = "smart_exp_session_v2";

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const EMOJI_OPTIONS = ["🍽️", "🚗", "📋", "🛍️", "💊", "🎬", "🎮", "📚", "🏠", "💼", "✈️", "🎵", "🏋️", "☕", "🍕", "🎁", "💡", "📱", "👕", "🐾", "🎓", "💳", "🔧", "🌐", "🎨", "🧹", "🚌", "💇", "🎪", "🧃"];

export const COLOR_OPTIONS = ["#f97316", "#06b6d4", "#8b5cf6", "#ec4899", "#10b981", "#f43f5e", "#3b82f6", "#fbbf24", "#a78bfa", "#14b8a6", "#e11d48", "#84cc16"];
