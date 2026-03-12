import { useState, useEffect, useCallback } from "react";
import { CURRENT_MONTH, CURRENT_YEAR, DEFAULT_CATS } from "../utils/constants";
import { monthKey } from "../utils/storage";
import { supabase } from "../utils/supabaseClient";
import {
    fetchUserData,
    upsertBudget,
    insertExpense,
    deleteExpenseById,
    upsertCategories,
    saveAllNotes,
} from "../utils/supabaseStorage";

/**
 * Custom hook that encapsulates all the app-level state management:
 * user auth, budget operations, expense CRUD, categories, and notes.
 * Now powered by Supabase instead of localStorage.
 */
export function useExpenseManager() {
    const [user, setUser] = useState(null);        // { id, email }
    const [screen, setScreen] = useState("auth");
    const [allUserData, setAllUserData] = useState(null);
    const [loading, setLoading] = useState(true);   // initial session check

    // Load user data from Supabase
    const loadData = useCallback(async (userId) => {
        try {
            const data = await fetchUserData(userId);
            setAllUserData(data);
            const curKey = monthKey(CURRENT_MONTH, CURRENT_YEAR);
            setScreen(data.months?.[curKey]?.budget ? "dashboard" : "setup");
        } catch (err) {
            console.error("Failed to load data:", err);
            setScreen("setup");
        }
    }, []);

    // Restore session on mount
    useEffect(() => {
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const u = { id: session.user.id, email: session.user.email };
                setUser(u);
                await loadData(u.id);
            }
            setLoading(false);
        };
        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setScreen("auth");
                    setAllUserData(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [loadData]);

    const login = async (authUser) => {
        setUser(authUser);
        setLoading(true);
        await loadData(authUser.id);
        setLoading(false);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setScreen("auth");
        setAllUserData(null);
    };

    const saveBudget = async (budget) => {
        try {
            await upsertBudget(user.id, budget);
            // Reload data to stay in sync
            await loadData(user.id);
            setScreen("dashboard");
        } catch (err) {
            console.error("Failed to save budget:", err);
            alert("Failed to save budget: " + (err.message || JSON.stringify(err)));
        }
    };

    const addExpense = async (expense) => {
        try {
            const key = monthKey(CURRENT_MONTH, CURRENT_YEAR);

            // If adding a new subcategory, update custom categories
            if (expense.isNewSub) {
                const currentCats = allUserData?.customCategories || {};
                const base = DEFAULT_CATS[expense.category]
                    ? { ...DEFAULT_CATS[expense.category] }
                    : { icon: "💳", color: "#f97316", subs: [] };
                const existing = currentCats[expense.category] || { ...base };
                if (!existing.subs.includes(expense.subCategory)) {
                    existing.subs = [...existing.subs, expense.subCategory];
                }
                const updatedCats = { ...currentCats, [expense.category]: existing };
                await upsertCategories(user.id, updatedCats);
            }

            await insertExpense(user.id, expense, key);
            await loadData(user.id);
        } catch (err) {
            console.error("Failed to add expense:", err);
            alert("Failed to add expense. Please try again.");
        }
    };

    const deleteExpense = async (expenseId) => {
        try {
            await deleteExpenseById(expenseId);
            await loadData(user.id);
        } catch (err) {
            console.error("Failed to delete expense:", err);
            alert("Failed to delete expense. Please try again.");
        }
    };

    const saveCategories = async (customCats) => {
        try {
            await upsertCategories(user.id, customCats);
            await loadData(user.id);
        } catch (err) {
            console.error("Failed to save categories:", err);
            alert("Failed to save categories. Please try again.");
        }
    };

    const saveNotes = async (notes) => {
        try {
            await saveAllNotes(user.id, notes);
            await loadData(user.id);
        } catch (err) {
            console.error("Failed to save notes:", err);
            alert("Failed to save notes. Please try again.");
        }
    };

    const currentKey = monthKey(CURRENT_MONTH, CURRENT_YEAR);
    const currentBudget = allUserData?.months?.[currentKey]?.budget || null;

    return {
        user,
        screen,
        setScreen,
        allUserData,
        currentBudget,
        loading,
        login,
        logout,
        saveBudget,
        addExpense,
        deleteExpense,
        saveCategories,
        saveNotes,
    };
}
