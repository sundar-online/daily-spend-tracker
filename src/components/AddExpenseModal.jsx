import { useState } from "react";
import { S } from "../styles/shared.jsx";
import { DEFAULT_CATS } from "../utils/constants";

export default function AddExpenseModal({ budget, onAdd, onClose }) {
    const cats = budget.customCategories
        ? { ...DEFAULT_CATS, ...budget.customCategories }
        : DEFAULT_CATS;
    const catKeys = Object.keys(cats);

    const [amt, setAmt] = useState("");
    const [cat, setCat] = useState(catKeys[0]);
    const subs = [
        ...(cats[cat]?.subs || []),
        ...(DEFAULT_CATS[cat]?.subs || []).filter(
            (s) => !(cats[cat]?.subs || []).includes(s)
        ),
    ].filter((v, i, a) => a.indexOf(v) === i);
    const [sub, setSub] = useState(subs[0] || "");
    const [note, setNote] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [addingNew, setAddingNew] = useState(false);
    const [newSub, setNewSub] = useState("");

    const catColor = cats[cat]?.color || "#f97316";

    const submit = () => {
        if (!amt || Number(amt) <= 0) return alert("Enter a valid amount.");
        const finalSub = addingNew ? newSub.trim() : sub;
        if (!finalSub) return alert("Select or enter a sub-category.");
        onAdd({
            id: Date.now(),
            amount: Number(amt),
            category: cat,
            subCategory: finalSub,
            note,
            date,
            isNewSub: addingNew && newSub.trim() !== "",
        });
        onClose();
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
            <div style={{ ...S.card, width: "100%", maxWidth: 480, background: "#12121a", border: "1px solid rgba(255,255,255,0.12)", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>💸 Add Expense</h3>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(240,236,228,0.6)", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>

                <label style={S.label}>Amount</label>
                <div style={{ position: "relative", marginBottom: 20 }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,236,228,0.4)", fontSize: 16, fontWeight: 700 }}>₹</span>
                    <input type="number" placeholder="0" value={amt} onChange={e => setAmt(e.target.value)} style={{ ...S.input, paddingLeft: 32, fontSize: 18, fontFamily: "'JetBrains Mono',monospace" }} />
                </div>

                <label style={S.label}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...S.input, marginBottom: 20 }} />

                <label style={S.label}>Main Category</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                    {catKeys.map(c => (
                        <button key={c} onClick={() => setCat(c)} style={{ ...S.pill(cat === c, cats[c]?.color || "#f97316"), display: "flex", alignItems: "center", gap: 6 }}>
                            <span>{cats[c]?.icon}</span>{c}
                        </button>
                    ))}
                </div>

                <label style={S.label}>Sub-Category</label>
                {!addingNew ? (
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        <select value={sub} onChange={e => setSub(e.target.value)} style={{ ...S.select, flex: 1 }}>
                            {subs.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => setAddingNew(true)} style={{ ...S.btn, background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)", padding: "10px 14px", fontSize: 13 }}>+ New</button>
                    </div>
                ) : (
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        <input type="text" placeholder={`New ${cat} sub-category…`} value={newSub} onChange={e => setNewSub(e.target.value)} style={{ ...S.input, flex: 1 }} />
                        <button onClick={() => setAddingNew(false)} style={{ ...S.btn, background: "rgba(255,255,255,0.06)", color: "rgba(240,236,228,0.6)", padding: "10px 14px", fontSize: 13 }}>Back</button>
                    </div>
                )}

                <label style={S.label}>Note (optional)</label>
                <input type="text" placeholder="e.g. Lunch with friends" value={note} onChange={e => setNote(e.target.value)} style={{ ...S.input, marginBottom: 24 }} />

                <button onClick={submit} style={{ ...S.btn, width: "100%", background: `linear-gradient(135deg,${catColor},${catColor}aa)`, color: "#fff", fontSize: 15, padding: "14px" }}>
                    Add Expense →
                </button>
            </div>
        </div>
    );
}
