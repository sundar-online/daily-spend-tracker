import { useState } from "react";
import { MONTHS, CURRENT_MONTH, CURRENT_YEAR } from "../utils/constants";
import { S, FontLink } from "../styles/shared.jsx";

export default function BudgetSetup({ username, existingBudget, targetMonth, targetYear, onSave, onBack }) {
    const [month, setMonth] = useState(existingBudget?.month ?? targetMonth ?? CURRENT_MONTH);
    const [year] = useState(targetYear ?? CURRENT_YEAR);
    const [sources, setSources] = useState(
        existingBudget?.sources ?? [{ name: "Parents", amount: "" }, { name: "Earnings", amount: "" }]
    );
    const [newSrc, setNewSrc] = useState("");

    const total = sources.reduce((s, x) => s + (Number(x.amount) || 0), 0);

    const handleSave = () => {
        if (total <= 0) return alert("Add at least one budget source with an amount.");
        onSave({ month, year, total, sources: sources.filter(s => Number(s.amount) > 0) });
    };

    return (
        <div style={{ ...S.app, padding: "32px 20px", display: "flex", justifyContent: "center" }}>
            <FontLink />
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 40% at 30% 20%, rgba(251,191,36,0.08) 0%, transparent 70%)" }} />
            <div style={{ maxWidth: 520, width: "100%", position: "relative" }}>
                <div style={{ marginBottom: 28 }}>
                    {onBack && <button onClick={onBack} style={{ ...S.btn, background: "rgba(255,255,255,0.06)", color: "rgba(240,236,228,0.6)", padding: "8px 16px", marginBottom: 16 }}>← Back</button>}
                    <h2 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>💰 Budget Setup</h2>
                    <p style={{ color: "rgba(240,236,228,0.4)", margin: "6px 0 0", fontSize: 14 }}>Define your income for {MONTHS[month]} {year}</p>
                </div>

                <div style={{ ...S.card, marginBottom: 16 }}>
                    <label style={S.label}>Select Month</label>
                    <select value={month} onChange={e => setMonth(Number(e.target.value))} style={S.select}>
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m} {year}</option>)}
                    </select>
                </div>

                <div style={{ ...S.card, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div>
                            <label style={{ ...S.label, marginBottom: 2 }}>Income Sources</label>
                            <p style={{ margin: 0, color: "rgba(240,236,228,0.35)", fontSize: 12 }}>Where does your money come from?</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: "rgba(240,236,228,0.4)", fontWeight: 700 }}>TOTAL</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24", fontFamily: "'JetBrains Mono',monospace" }}>₹{total.toLocaleString()}</div>
                        </div>
                    </div>

                    {sources.map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#f0ece4", marginBottom: 4 }}>{s.name}</div>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,236,228,0.4)", fontSize: 14, fontWeight: 700 }}>₹</span>
                                    <input type="number" placeholder="0" value={s.amount} onChange={e => setSources(p => p.map((x, idx) => idx === i ? { ...x, amount: e.target.value } : x))} style={{ ...S.input, paddingLeft: 30 }} />
                                </div>
                            </div>
                            <button onClick={() => setSources(p => p.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "rgba(248,113,113,0.6)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "4px", marginTop: 16 }}>×</button>
                        </div>
                    ))}

                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <input type="text" placeholder="Add source (e.g. Freelance)…" value={newSrc} onChange={e => setNewSrc(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { const nm = newSrc.trim() || "Other"; if (!sources.find(s => s.name.toLowerCase() === nm.toLowerCase())) setSources(p => [...p, { name: nm, amount: "" }]); setNewSrc(""); } }} style={{ ...S.input, flex: 1 }} />
                        <button onClick={() => { const nm = newSrc.trim() || "Other"; if (!sources.find(s => s.name.toLowerCase() === nm.toLowerCase())) setSources(p => [...p, { name: nm, amount: "" }]); setNewSrc(""); }} style={{ ...S.btn, background: "rgba(249,115,22,0.2)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)", padding: "12px 18px" }}>+ Add</button>
                    </div>
                </div>

                <button onClick={handleSave} style={{ ...S.btn, width: "100%", background: "linear-gradient(135deg,#f97316,#fbbf24)", color: "#0d0d0f", fontSize: 16, padding: "16px" }}>
                    Save Budget & Continue →
                </button>
            </div>
        </div>
    );
}
