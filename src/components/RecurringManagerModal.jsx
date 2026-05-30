import { useState } from "react";
import { S } from "../styles/shared.jsx";

const emptyForm = {
    id: null,
    name: "",
    amount: "",
    category: "",
    subCategory: "",
    frequency: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    isActive: true,
};

export default function RecurringManagerModal({ recurringRules, categories, onSaveRule, onDeleteRule, onClose }) {
    const [form, setForm] = useState(emptyForm);

    const startAdd = () => setForm({ ...emptyForm, category: Object.keys(categories || {})[0] || "" });

    const startEdit = (rule) => {
        setForm({
            id: rule.id,
            name: rule.name,
            amount: String(rule.amount),
            category: rule.category,
            subCategory: rule.subCategory,
            frequency: rule.frequency,
            startDate: rule.startDate,
            isActive: rule.isActive,
        });
    };

    const save = () => {
        const amount = Number(form.amount);
        if (!form.name.trim() || !amount || !form.category || !form.startDate) return;
        onSaveRule({
            id: form.id,
            name: form.name.trim(),
            amount,
            category: form.category,
            subCategory: form.subCategory.trim() || form.name.trim(),
            frequency: form.frequency,
            startDate: form.startDate,
            isActive: form.isActive,
        });
        setForm(emptyForm);
    };

    const isEditing = !!form.name || !!form.id;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 140, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
            <div className="slide-up" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 760, maxHeight: "84vh", overflowY: "auto", background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>🔁 Recurring Expenses</h3>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(240,236,228,0.7)", width: 32, height: 32, borderRadius: 10, cursor: "pointer" }}>✕</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    {(recurringRules || []).length === 0 ? (
                        <div style={{ color: "rgba(240,236,228,0.25)", fontSize: 13, textAlign: "center", padding: "12px 0" }}>No recurring rules yet.</div>
                    ) : (
                        recurringRules.map((rule) => (
                            <div key={rule.id} style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{rule.name} <span style={{ color: "#fbbf24" }}>₹{Number(rule.amount).toLocaleString()}</span></div>
                                    <div style={{ fontSize: 11, color: "rgba(240,236,228,0.4)" }}>{rule.category} · {rule.subCategory} · {rule.frequency} · starts {rule.startDate}</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <button onClick={() => onSaveRule({ ...rule, isActive: !rule.isActive })} style={{ ...S.btn, padding: "6px 10px", fontSize: 11, background: rule.isActive ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.08)", color: rule.isActive ? "#10b981" : "rgba(240,236,228,0.6)" }}>{rule.isActive ? "Active" : "Paused"}</button>
                                    <button onClick={() => startEdit(rule)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(240,236,228,0.8)", width: 32, height: 32, borderRadius: 8, cursor: "pointer" }}>✏️</button>
                                    <button onClick={() => onDeleteRule(rule.id)} style={{ background: "rgba(248,113,113,0.12)", border: "none", color: "#f87171", width: 32, height: 32, borderRadius: 8, cursor: "pointer" }}>🗑️</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {!isEditing ? (
                    <button onClick={startAdd} style={{ ...S.btn, width: "100%", background: "rgba(255,255,255,0.08)", color: "rgba(240,236,228,0.8)", marginBottom: 12 }}>
                        + Add Recurring Expense
                    </button>
                ) : (
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
                            <input placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={S.input} />
                            <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} style={S.input} />
                            <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} style={S.select}>
                                {Object.keys(categories || {}).map((name) => <option key={name} value={name}>{name}</option>)}
                            </select>
                            <input placeholder="Sub-category" value={form.subCategory} onChange={(e) => setForm((p) => ({ ...p, subCategory: e.target.value }))} style={S.input} />
                            <select value={form.frequency} onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))} style={S.select}>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                            <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} style={S.input} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                            <button onClick={() => setForm(emptyForm)} style={{ ...S.btn, padding: "8px 12px", fontSize: 12, background: "rgba(255,255,255,0.07)", color: "rgba(240,236,228,0.75)" }}>Cancel</button>
                            <button onClick={save} style={{ ...S.btn, padding: "8px 16px", fontSize: 12, background: "linear-gradient(135deg,#10b981,#06b6d4)", color: "#0d0d0f" }}>Save</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
