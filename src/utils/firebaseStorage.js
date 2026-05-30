import {
    doc,
    collection,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    deleteDoc,
    writeBatch,
    serverTimestamp,
    query,
    orderBy,
    where,
} from 'firebase/firestore';
import { db } from './firebaseClient';
import { monthKey } from './storage';

// ─────────────────────────────────────────────────────────────
// Firestore path helpers
// Data is stored under: users/{userId}/<subcollection>/...
// ─────────────────────────────────────────────────────────────
const budgetRef   = (uid, mKey)  => doc(db, 'users', uid, 'budgets', mKey);
const expensesCol = (uid)        => collection(db, 'users', uid, 'expenses');
const expenseRef  = (uid, expId) => doc(db, 'users', uid, 'expenses', expId);
const notesCol    = (uid)        => collection(db, 'users', uid, 'notes');
const catsRef     = (uid)        => doc(db, 'users', uid, 'customCategories', 'default');
const recurringCol = (uid)       => collection(db, 'users', uid, 'recurringExpenses');
const recurringRef = (uid, id)   => doc(db, 'users', uid, 'recurringExpenses', id);
const goalsCol     = (uid)       => collection(db, 'users', uid, 'savingsGoals');
const goalRef      = (uid, id)   => doc(db, 'users', uid, 'savingsGoals', id);

// ─────────────────────────────────────────────────────────────
// fetchUserData — mirrors the Supabase version:
// Returns { months: { "2025-01": { budget, expenses[] } }, customCategories, notes[] }
// ─────────────────────────────────────────────────────────────
export async function fetchUserData(userId) {
    const [budgetsSnap, expensesSnap, notesSnap, catsSnap, recurringSnap, goalsSnap] = await Promise.all([
        getDocs(collection(db, 'users', userId, 'budgets')),
        getDocs(query(expensesCol(userId), orderBy('createdAt', 'desc'))),
        getDocs(query(notesCol(userId),    orderBy('createdAt', 'desc'))),
        getDoc(catsRef(userId)),
        getDocs(query(recurringCol(userId), orderBy('createdAt', 'desc'))),
        getDocs(query(goalsCol(userId), orderBy('createdAt', 'desc'))),
    ]);

    const months = {};

    // Build budgets into months
    budgetsSnap.forEach(snap => {
        const b   = snap.data();
        const key = snap.id; // stored as monthKey e.g. "2025-01"
        if (!months[key]) months[key] = { expenses: [] };
        months[key].budget = {
            month:   b.month,
            year:    b.year,
            total:   Number(b.total),
            sources: b.sources || [],
            id:      snap.id,
        };
    });

    // Build expenses into months
    expensesSnap.forEach(snap => {
        const e = snap.data();
        if (!months[e.monthKey]) months[e.monthKey] = { expenses: [] };
        months[e.monthKey].expenses.push({
            id:          snap.id,
            amount:      Number(e.amount),
            name:        e.name || '',
            category:    e.category,
            subCategory: e.subCategory,
            date:        e.date,
            note:        e.note || '',
            isNewSub:    e.isNewSub || false,
            recurringId: e.recurringId || null,
            isRecurring: e.isRecurring || false,
        });
    });

    // Custom categories — single document
    let customCategories = null;
    if (catsSnap && catsSnap.exists && catsSnap.exists()) {
        customCategories = catsSnap.data().categories || null;
    }

    // Notes
    const notes = [];
    notesSnap.forEach(snap => {
        const n = snap.data();
        notes.push({
            id:        snap.id,
            text:      n.text,
            amount:    n.amount !== undefined ? Number(n.amount) : null,
            pinned:    n.pinned  || false,
            done:      n.done    || false,
            createdAt: n.createdAt
                ? (typeof n.createdAt.toDate === 'function'
                    ? n.createdAt.toDate().toISOString().split('T')[0]
                    : String(n.createdAt).split('T')[0])
                : new Date().toISOString().split('T')[0],
        });
    });

    const recurringExpenses = [];
    recurringSnap.forEach(snap => {
        const r = snap.data();
        recurringExpenses.push({
            id: snap.id,
            name: r.name || '',
            amount: Number(r.amount || 0),
            category: r.category || '',
            subCategory: r.subCategory || '',
            frequency: r.frequency || 'monthly',
            startDate: r.startDate
                ? (typeof r.startDate.toDate === 'function'
                    ? r.startDate.toDate().toISOString().split('T')[0]
                    : String(r.startDate).split('T')[0])
                : '',
            isActive: r.isActive !== false,
            createdAt: r.createdAt || null,
        });
    });

    const savingsGoals = [];
    goalsSnap.forEach(snap => {
        const g = snap.data();
        savingsGoals.push({
            id: snap.id,
            name: g.name || '',
            emoji: g.emoji || '🎯',
            targetAmount: Number(g.targetAmount || 0),
            savedAmount: Number(g.savedAmount || 0),
            deadline: g.deadline
                ? (typeof g.deadline.toDate === 'function'
                    ? g.deadline.toDate().toISOString().split('T')[0]
                    : String(g.deadline).split('T')[0])
                : null,
            createdAt: g.createdAt || null,
        });
    });

    return { months, customCategories, notes, recurringExpenses, savingsGoals };
}

// ─────────────────────────────────────────────────────────────
// upsertBudget — set/overwrite budget document for month
// ─────────────────────────────────────────────────────────────
export async function upsertBudget(userId, budget) {
    const key = monthKey(budget.month, budget.year);
    const ref = budgetRef(userId, key);
    await setDoc(ref, {
        month:     budget.month,
        year:      budget.year,
        total:     budget.total,
        sources:   budget.sources || [],
        updatedAt: serverTimestamp(),
    }, { merge: true });
    return { id: key, ...budget };
}

// ─────────────────────────────────────────────────────────────
// insertExpense — add a new expense document
// ─────────────────────────────────────────────────────────────
export async function insertExpense(userId, expense, mKey) {
    const docRef = await addDoc(expensesCol(userId), {
        monthKey:    mKey,
        name:        expense.name || '',
        amount:      expense.amount,
        category:    expense.category,
        subCategory: expense.subCategory || '',
        date:        expense.date,
        note:        expense.note || '',
        isNewSub:    expense.isNewSub || false,
        recurringId: expense.recurringId || null,
        isRecurring: expense.isRecurring || false,
        createdAt:   serverTimestamp(),
    });
    return { id: docRef.id, ...expense };
}

// ─────────────────────────────────────────────────────────────
// deleteExpenseById — remove a single expense document
// ─────────────────────────────────────────────────────────────
export async function deleteExpenseById(userId, expenseId) {
    await deleteDoc(expenseRef(userId, expenseId));
}

// ─────────────────────────────────────────────────────────────
// upsertCategories — store custom categories as a single doc
// ─────────────────────────────────────────────────────────────
export async function upsertCategories(userId, categories) {
    await setDoc(catsRef(userId), {
        categories,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

// ─────────────────────────────────────────────────────────────
// saveAllNotes — batch-delete existing notes, then batch-insert new ones
// ─────────────────────────────────────────────────────────────
export async function saveAllNotes(userId, notes) {
    const existingSnap = await getDocs(notesCol(userId));
    const batch = writeBatch(db);

    // Delete all existing notes
    existingSnap.forEach(snap => batch.delete(snap.ref));

    // Add new notes
    notes.forEach(n => {
        const ref = doc(notesCol(userId)); // auto-ID
        batch.set(ref, {
            text:      n.text,
            amount:    n.amount ?? null,
            pinned:    n.pinned  || false,
            done:      n.done    || false,
            createdAt: n.createdAt
                ? new Date(n.createdAt + 'T00:00:00').toISOString()
                : new Date().toISOString(),
        });
    });

    await batch.commit();
}

export async function createRecurringExpense(userId, payload) {
    const ref = await addDoc(recurringCol(userId), {
        name: payload.name,
        amount: Number(payload.amount),
        category: payload.category,
        subCategory: payload.subCategory || '',
        frequency: payload.frequency,
        startDate: new Date(payload.startDate + 'T00:00:00'),
        isActive: payload.isActive !== false,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateRecurringExpense(userId, recurringId, payload) {
    await setDoc(recurringRef(userId, recurringId), {
        name: payload.name,
        amount: Number(payload.amount),
        category: payload.category,
        subCategory: payload.subCategory || '',
        frequency: payload.frequency,
        startDate: new Date(payload.startDate + 'T00:00:00'),
        isActive: payload.isActive !== false,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

export async function deleteRecurringExpense(userId, recurringId) {
    await deleteDoc(recurringRef(userId, recurringId));
}

function getRecurringDatesForMonth(rule, month, year) {
    const start = new Date(rule.startDate + 'T00:00:00');
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    if (start > monthEnd) return [];

    const activeStart = start > monthStart ? start : monthStart;
    const dates = [];

    if (rule.frequency === 'daily') {
        const cur = new Date(activeStart);
        while (cur <= monthEnd) {
            dates.push(cur.toISOString().split('T')[0]);
            cur.setDate(cur.getDate() + 1);
        }
        return dates;
    }

    if (rule.frequency === 'weekly') {
        const targetDay = start.getDay();
        const cur = new Date(activeStart);
        while (cur.getDay() !== targetDay) cur.setDate(cur.getDate() + 1);
        while (cur <= monthEnd) {
            dates.push(cur.toISOString().split('T')[0]);
            cur.setDate(cur.getDate() + 7);
        }
        return dates;
    }

    const targetDate = start.getDate();
    const maxDate = monthEnd.getDate();
    if (targetDate <= maxDate) {
        const d = new Date(year, month, targetDate);
        if (d >= activeStart) dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
}

export async function generateRecurringExpensesForMonth(userId, rules, month, year) {
    const activeRules = (rules || []).filter(r => r.isActive && r.startDate);
    if (activeRules.length === 0) return 0;

    const mKey = monthKey(month, year);
    const existingSnap = await getDocs(query(expensesCol(userId), where('monthKey', '==', mKey)));
    const existingKeys = new Set();
    existingSnap.forEach(snap => {
        const data = snap.data();
        if (data.recurringId && data.date) {
            existingKeys.add(`${data.recurringId}::${data.date}`);
        }
    });

    let inserted = 0;
    const batch = writeBatch(db);

    activeRules.forEach((rule) => {
        const dates = getRecurringDatesForMonth(rule, month, year);
        dates.forEach((dateStr) => {
            const key = `${rule.id}::${dateStr}`;
            if (existingKeys.has(key)) return;
            const ref = doc(expensesCol(userId));
            batch.set(ref, {
                monthKey: mKey,
                name: rule.name,
                amount: Number(rule.amount),
                category: rule.category,
                subCategory: rule.subCategory || rule.name,
                date: dateStr,
                note: '',
                isNewSub: false,
                recurringId: rule.id,
                isRecurring: true,
                createdAt: serverTimestamp(),
            });
            existingKeys.add(key);
            inserted += 1;
        });
    });

    if (inserted > 0) await batch.commit();
    return inserted;
}

export async function createSavingsGoal(userId, payload) {
    await addDoc(goalsCol(userId), {
        name: payload.name,
        emoji: payload.emoji || '🎯',
        targetAmount: Number(payload.targetAmount),
        savedAmount: 0,
        deadline: payload.deadline ? new Date(payload.deadline + 'T00:00:00') : null,
        createdAt: serverTimestamp(),
    });
}

export async function addSavingsContribution(userId, goalId, amount, currentSavedAmount) {
    await setDoc(goalRef(userId, goalId), {
        savedAmount: Number(currentSavedAmount || 0) + Number(amount || 0),
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

export async function deleteSavingsGoal(userId, goalId) {
    await deleteDoc(goalRef(userId, goalId));
}
