import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { CURRENT_MONTH, CURRENT_YEAR, DEFAULT_CATS } from "../utils/constants";
import { monthKey } from "../utils/storage";
import { auth } from "../utils/firebaseClient";
import {
    fetchUserData,
    upsertBudget,
    insertExpense,
    deleteExpenseById,
    upsertCategories,
    saveAllNotes,
} from "../utils/firebaseStorage";

/**
 * Custom hook that encapsulates all the app-level state management:
 * user auth, budget operations, expense CRUD, categories, and notes.
 * Powered by Firebase Auth + Firestore.
 */
export function useExpenseManager() {
    const [user, setUser] = useState(null);        // { id, email }
    const [screen, setScreen] = useState("auth");
    const [allUserData, setAllUserData] = useState(null);
    const [loading, setLoading] = useState(true);   // initial session check

    // Load user data from Firestore
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

    // Firebase Auth — onAuthStateChanged handles session restore automatically
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const u = { id: firebaseUser.uid, email: firebaseUser.email };
                setUser(u);
                await loadData(u.id);
            } else {
                setUser(null);
                setScreen("auth");
                setAllUserData(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [loadData]);

    const login = async (authUser) => {
        // Called after successful sign-in from AuthScreen.
        // onAuthStateChanged fires automatically, but we still set user
        // immediately for a snappier UI response.
        setUser(authUser);
        setLoading(true);
        await loadData(authUser.id);
        setLoading(false);
    };

    const logout = async () => {
        await signOut(auth);
        // onAuthStateChanged will fire and clear state automatically
    };

    const saveBudget = async (budget) => {
        try {
            await upsertBudget(user.id, budget);
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

            // If adding a new subcategory, update custom categories first
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
            await deleteExpenseById(user.id, expenseId);
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
