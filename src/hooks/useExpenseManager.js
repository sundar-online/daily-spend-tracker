import { useState, useEffect } from "react";
import { CURRENT_MONTH, CURRENT_YEAR, DEFAULT_CATS, SESSION_KEY } from "../utils/constants";
import { monthKey, load, persist } from "../utils/storage";

/**
 * Custom hook that encapsulates all the app-level state management:
 * user auth, budget operations, expense CRUD, categories, and notes.
 */
export function useExpenseManager() {
    const [user, setUser] = useState(null);
    const [screen, setScreen] = useState("auth");
    const [allUserData, setAllUserData] = useState(null);

    // Restore session on mount
    useEffect(() => {
        const session = sessionStorage.getItem(SESSION_KEY);
        if (session) {
            setUser(session);
            const stored = load();
            const ud = stored[session] || { months: {} };
            setAllUserData(ud);
            const curKey = monthKey(CURRENT_MONTH, CURRENT_YEAR);
            setScreen(ud.months?.[curKey]?.budget ? "dashboard" : "setup");
        }
    }, []);

    const login = (username) => {
        setUser(username);
        sessionStorage.setItem(SESSION_KEY, username);
        const stored = load();
        const ud = stored[username] || { months: {} };
        setAllUserData(ud);
        const curKey = monthKey(CURRENT_MONTH, CURRENT_YEAR);
        setScreen(ud.months?.[curKey]?.budget ? "dashboard" : "setup");
    };

    const logout = () => {
        sessionStorage.removeItem(SESSION_KEY);
        setUser(null);
        setScreen("auth");
        setAllUserData(null);
    };

    const saveBudget = (budget) => {
        const stored = load();
        const key = monthKey(budget.month, budget.year);
        const ud = stored[user] || { months: {} };
        if (!ud.months) ud.months = {};
        if (!ud.months[key]) ud.months[key] = { expenses: [] };
        ud.months[key].budget = budget;
        stored[user] = ud;
        persist(stored);
        setAllUserData({ ...ud });
        setScreen("dashboard");
    };

    const addExpense = (expense) => {
        const stored = load();
        const key = monthKey(CURRENT_MONTH, CURRENT_YEAR);
        const ud = stored[user] || { months: {} };
        if (!ud.months) ud.months = {};
        if (!ud.months[key]) ud.months[key] = { expenses: [] };

        if (expense.isNewSub) {
            if (!ud.customCategories) ud.customCategories = {};
            const base = DEFAULT_CATS[expense.category]
                ? { ...DEFAULT_CATS[expense.category] }
                : { icon: "💳", color: "#f97316", subs: [] };
            const existing = ud.customCategories[expense.category] || { ...base };
            if (!existing.subs.includes(expense.subCategory))
                existing.subs = [...existing.subs, expense.subCategory];
            ud.customCategories[expense.category] = existing;
            if (ud.months[key].budget) {
                if (!ud.months[key].budget.customCategories)
                    ud.months[key].budget.customCategories = {};
                ud.months[key].budget.customCategories[expense.category] = existing;
            }
        }

        ud.months[key].expenses = [...(ud.months[key].expenses || []), expense];
        stored[user] = ud;
        persist(stored);
        setAllUserData({ ...ud });
    };

    const deleteExpense = (expenseId) => {
        const stored = load();
        const ud = stored[user] || { months: {} };
        Object.keys(ud.months || {}).forEach((key) => {
            if (ud.months[key]?.expenses) {
                ud.months[key].expenses = ud.months[key].expenses.filter(
                    (e) => e.id !== expenseId
                );
            }
        });
        stored[user] = ud;
        persist(stored);
        setAllUserData({ ...ud });
    };

    const saveCategories = (customCats) => {
        const stored = load();
        const ud = stored[user] || { months: {} };
        ud.customCategories = customCats;
        stored[user] = ud;
        persist(stored);
        setAllUserData({ ...ud });
    };

    const saveNotes = (notes) => {
        const stored = load();
        const ud = stored[user] || { months: {} };
        ud.notes = notes;
        stored[user] = ud;
        persist(stored);
        setAllUserData({ ...ud });
    };

    const currentKey = monthKey(CURRENT_MONTH, CURRENT_YEAR);
    const currentBudget = allUserData?.months?.[currentKey]?.budget || null;

    return {
        user,
        screen,
        setScreen,
        allUserData,
        currentBudget,
        login,
        logout,
        saveBudget,
        addExpense,
        deleteExpense,
        saveCategories,
        saveNotes,
    };
}
