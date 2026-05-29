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

// ─────────────────────────────────────────────────────────────
// fetchUserData — mirrors the Supabase version:
// Returns { months: { "2025-01": { budget, expenses[] } }, customCategories, notes[] }
// ─────────────────────────────────────────────────────────────
export async function fetchUserData(userId) {
    const [budgetsSnap, expensesSnap, notesSnap, catsSnap] = await Promise.all([
        getDocs(collection(db, 'users', userId, 'budgets')),
        getDocs(query(expensesCol(userId), orderBy('createdAt', 'desc'))),
        getDocs(query(notesCol(userId),    orderBy('createdAt', 'desc'))),
        getDoc(catsRef(userId)),
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
            category:    e.category,
            subCategory: e.subCategory,
            date:        e.date,
            note:        e.note || '',
            isNewSub:    e.isNewSub || false,
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

    return { months, customCategories, notes };
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
        amount:      expense.amount,
        category:    expense.category,
        subCategory: expense.subCategory || '',
        date:        expense.date,
        note:        expense.note || '',
        isNewSub:    expense.isNewSub || false,
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
