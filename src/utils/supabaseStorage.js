import { supabase } from './supabaseClient';
import { monthKey } from './storage';

/**
 * Fetch all user data from Supabase (budgets, expenses, notes, categories).
 * Returns the same shape as the old localStorage structure:
 * { months: { "2025-01": { budget, expenses } }, customCategories, notes }
 */
export async function fetchUserData(userId) {
    const [budgetsRes, expensesRes, notesRes, catsRes] = await Promise.all([
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase.from('expenses').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('notes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('custom_categories').select('*').eq('user_id', userId).single(),
    ]);

    const months = {};

    // Build budgets into months
    (budgetsRes.data || []).forEach(b => {
        const key = monthKey(b.month, b.year);
        if (!months[key]) months[key] = { expenses: [] };
        months[key].budget = {
            month: b.month,
            year: b.year,
            total: Number(b.total),
            sources: b.sources || [],
            id: b.id,
        };
    });

    // Build expenses into months
    (expensesRes.data || []).forEach(e => {
        if (!months[e.month_key]) months[e.month_key] = { expenses: [] };
        months[e.month_key].expenses.push({
            id: e.id,
            amount: Number(e.amount),
            category: e.category,
            subCategory: e.sub_category,
            date: e.date,
            note: e.note || '',
            isNewSub: e.is_new_sub || false,
        });
    });

    const customCategories = catsRes.data?.categories || null;

    const notes = (notesRes.data || []).map(n => ({
        id: n.id,
        text: n.text,
        amount: n.amount ? Number(n.amount) : null,
        pinned: n.pinned || false,
        done: n.done || false,
        createdAt: n.created_at ? n.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    }));

    return { months, customCategories, notes };
}

/**
 * Insert or update a budget for a given month/year.
 */
export async function upsertBudget(userId, budget) {
    const { data, error } = await supabase
        .from('budgets')
        .upsert(
            {
                user_id: userId,
                month: budget.month,
                year: budget.year,
                total: budget.total,
                sources: budget.sources,
            },
            { onConflict: 'user_id,month,year' }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Insert a new expense.
 */
export async function insertExpense(userId, expense, mKey) {
    const { data, error } = await supabase
        .from('expenses')
        .insert({
            user_id: userId,
            month_key: mKey,
            amount: expense.amount,
            category: expense.category,
            sub_category: expense.subCategory,
            date: expense.date,
            note: expense.note || '',
            is_new_sub: expense.isNewSub || false,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete an expense by its ID.
 */
export async function deleteExpenseById(expenseId) {
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

    if (error) throw error;
}

/**
 * Upsert custom categories for a user.
 */
export async function upsertCategories(userId, categories) {
    const { error } = await supabase
        .from('custom_categories')
        .upsert(
            {
                user_id: userId,
                categories,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
        );

    if (error) throw error;
}

/**
 * Save notes — delete all existing notes and insert new ones.
 */
export async function saveAllNotes(userId, notes) {
    // Delete all existing notes for this user
    const { error: delError } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', userId);

    if (delError) throw delError;

    if (notes.length === 0) return;

    // Insert all notes
    const rows = notes.map(n => ({
        user_id: userId,
        text: n.text,
        amount: n.amount || null,
        pinned: n.pinned || false,
        done: n.done || false,
        created_at: n.createdAt
            ? new Date(n.createdAt + 'T00:00:00').toISOString()
            : new Date().toISOString(),
    }));

    const { error: insError } = await supabase.from('notes').insert(rows);

    if (insError) throw insError;
}
