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
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    generateRecurringExpensesForMonth,
    createSavingsGoal,
    addSavingsContribution,
    deleteSavingsGoal,
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
                const existing = currentCats[expense.category]
                    ? { ...currentCats[expense.category], subs: [...(currentCats[expense.category].subs || [])] }
                    : { ...base, subs: [...(base.subs || [])] };
                if (!existing.subs.includes(expense.subCategory)) {
                    existing.subs.push(expense.subCategory);
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

    const ensureRecurringForMonth = async (month, year) => {
        try {
            const rules = allUserData?.recurringExpenses || [];
            const inserted = await generateRecurringExpensesForMonth(user.id, rules, month, year);
            if (inserted > 0) {
                await loadData(user.id);
            }
        } catch (err) {
            console.error("Failed to generate recurring expenses:", err);
        }
    };

    const saveRecurringRule = async (rule) => {
        try {
            if (rule.id) {
                await updateRecurringExpense(user.id, rule.id, rule);
            } else {
                await createRecurringExpense(user.id, rule);
            }
            await loadData(user.id);
        } catch (err) {
            console.error("Failed to save recurring rule:", err);
            alert("Failed to save recurring rule. Please try again.");
        }
    };

    const removeRecurringRule = async (recurringId) => {
        try {
            await deleteRecurringExpense(user.id, recurringId);
            await loadData(user.id);
        } catch (err) {
            console.error("Failed to delete recurring rule:", err);
            alert("Failed to delete recurring rule. Please try again.");
        }
    };

    const saveSavingsGoal = async (goal) => {
        try {
            await createSavingsGoal(user.id, goal);
            await loadData(user.id);
        } catch (err) {
            console.error("Failed to create savings goal:", err);
            alert("Failed to create savings goal. Please try again.");
        }
    };

    const contributeToGoal = async (goalId, amount, currentSavedAmount, goalName) => {
        try {
            await addSavingsContribution(user.id, goalId, amount, currentSavedAmount);

            // Log the contribution as an expense under "Savings" category
            const key = monthKey(CURRENT_MONTH, CURRENT_YEAR);
            const currentCats = allUserData?.customCategories || {};
            const existing = currentCats["Savings"]
                ? { ...currentCats["Savings"], subs: [...(currentCats["Savings"].subs || [])] }
                : { icon: "🎯", color: "#fbbf24", subs: [] };
            if (!existing.subs.includes(goalName)) {
                existing.subs.push(goalName);
                const updatedCats = { ...currentCats, "Savings": existing };
                await upsertCategories(user.id, updatedCats);
            }

            const expense = {
                amount: Number(amount),
                category: "Savings",
                subCategory: goalName,
                note: `Savings Goal: ${goalName}`,
                date: new Date().toISOString().split("T")[0],
            };

            await insertExpense(user.id, expense, key);
            await loadData(user.id);
        } catch (err) {
            console.error("Failed to add savings contribution:", err);
            alert("Failed to add contribution. Please try again.");
        }
    };

    const removeSavingsGoal = async (goalId) => {
        try {
            await deleteSavingsGoal(user.id, goalId);
            await loadData(user.id);
        } catch (err) {
            console.error("Failed to delete savings goal:", err);
            alert("Failed to delete savings goal. Please try again.");
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
        ensureRecurringForMonth,
        saveRecurringRule,
        removeRecurringRule,
        saveSavingsGoal,
        contributeToGoal,
        removeSavingsGoal,
    };
}
